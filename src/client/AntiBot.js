const { randomUUID } = require('node:crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const Coin = require('../database/models/coins');
const config = require('../config');
const { Theme } = require('../utils/embeds');
const { shuffle } = require('../utils/helpers');
const logger = require('../utils/logger');

class AntiBot {
  constructor() {
    this.messageCounts = new Map();
    this.processing = new Set();
    this.THRESHOLD = 25;
    this.CAPTCHA_TIMEOUT = 10_000;
  }

  async check(message) {
    if (!message.guild) return true;
    const userId = message.author.id;
    if (this.processing.has(userId)) {
      await message.react('❌').catch(() => {});
      return false;
    }

    const count = (this.messageCounts.get(userId) || 0) + 1;
    this.messageCounts.set(userId, count);
    if (count < this.THRESHOLD) return true;
    return this.runCaptcha(message, userId);
  }

  async runCaptcha(message, userId) {
    this.processing.add(userId);
    let prompt;
    try {
      const correctId = randomUUID();
      const buttons = Array.from({ length: 5 }, (_, index) => new ButtonBuilder()
        .setCustomId(index === 0 ? correctId : randomUUID())
        .setStyle(index === 0 ? ButtonStyle.Danger : ButtonStyle.Success)
        .setLabel('Click'));
      prompt = await message.channel.send({
        content: message.author.toString(),
        embeds: [
          new EmbedBuilder()
            .setTitle('Anti-Bot')
            .setColor(Theme.error)
            .setDescription('Click the **RED** button to continue!')
            .setFooter({ text: 'Failing the captcha wipes your coins. You have 10 seconds.' })
        ],
        components: [new ActionRowBuilder().addComponents(shuffle(buttons))]
      });

      const collector = prompt.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (interaction) => interaction.user.id === userId,
        time: this.CAPTCHA_TIMEOUT,
        max: 1
      });
      const { button, reason } = await new Promise((resolve) => {
        collector.once('end', (collected, endReason) => {
          resolve({ button: collected.first(), reason: endReason });
        });
      });

      // A deleted message/channel or stopped collector is not a failed captcha.
      if (!button && reason !== 'time') return false;
      const passed = button?.customId === correctId;
      // Determine the result before any awaited Discord request. Collector end
      // can run before deferUpdate settles when max: 1 is reached.
      if (button) await button.deferUpdate().catch((error) => logger.warn('Captcha acknowledgement failed', error));

      if (passed) {
        await message.channel.send({ content: `${message.author} you can continue using the bot!` });
      } else {
        const previous = await Coin.findOneAndDelete({ userId });
        const owner = await message.client.users.fetch(config.roles.staff.owner).catch(() => null);
        if (owner) {
          await owner.send({
            content: `${message.author} failed the captcha [Jump](${message.url})`,
            embeds: [{ description: `Coins: ${previous?.coins || 0}` }]
          }).catch((error) => logger.warn('Could not notify the owner about a captcha failure', error));
        }
        await message.channel.send({
          content: `${message.author} you failed the captcha! All your coins are wiped.`
        });
      }
    } catch (error) {
      logger.error('Captcha failed to complete', error);
    } finally {
      this.messageCounts.delete(userId);
      this.processing.delete(userId);
      if (prompt) await prompt.edit({ components: [] }).catch(() => {});
    }
    return false;
  }
}

module.exports = new AntiBot();
module.exports.AntiBot = AntiBot;