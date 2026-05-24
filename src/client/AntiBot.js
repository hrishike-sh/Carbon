const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Coin = require('../database/models/coins');
const config = require('../config');
const { Theme } = require('../utils/embeds');

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

    if (!this.messageCounts.has(userId)) {
      this.messageCounts.set(userId, 0);
    }

    if (this.processing.has(userId)) {
      await message.react('❌');
      return false;
    }

    const count = this.messageCounts.get(userId);
    this.messageCounts.set(userId, count + 1);

    if (count < this.THRESHOLD) return true;

    return this.runCaptcha(message, userId);
  }

  async runCaptcha(message, userId) {
    this.processing.add(userId);

    const msg = await message.channel.send({
      content: message.author.toString(),
      embeds: [
        new EmbedBuilder()
          .setTitle('Anti-Bot')
          .setColor(Theme.error)
          .setDescription('Click the **RED** button to continue!')
          .setFooter({ text: 'Failing the captcha will get you banned. You have 10 seconds.' })
      ],
      components: [
        new ActionRowBuilder().addComponents(
          [
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click')
          ].sort(() => Math.random() - 0.5)
        )
      ]
    });

    const collector = msg.createMessageComponentCollector({
      filter: (m) => m.user.id === userId,
      time: this.CAPTCHA_TIMEOUT,
      max: 1
    });

    let captchaPassed = false;
    collector.on('collect', async (button) => {
      await button.deferUpdate();
      if (button.component.style === ButtonStyle.Danger) {
        captchaPassed = true;
      }
    });

    collector.on('end', async () => {
      if (!captchaPassed) {
        const temp = await Coin.findOne({ userId });
        await Coin.deleteOne({ userId });

        const owner = config.roles.staff.owner;
        const ownerUser = message.client.users.cache.get(owner);
        if (ownerUser) {
          await ownerUser.send({
            content: `${message.author.toString()} failed the captcha [Jump](${message.url})`,
            embeds: [{ description: `Coins: ${temp?.coins || 0}` }]
          });
        }

        await message.channel.send({
          content: `${message.author.toString()} you failed the captcha! All your coins are wiped.`
        });
      } else {
        await message.channel.send({
          content: `${message.author.toString()} you can continue using the bot!`
        });
      }

      this.messageCounts.set(userId, 0);
      this.processing.delete(userId);
    });

    return false;
  }
}

module.exports = new AntiBot();
