const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

const activeChannels = new Set();

module.exports = {
  name: 'guessthenumber',
  aliases: ['gtn'],
  cooldown: 60,
  roles: [config.roles.giveawayManager, config.roles.staff.mod, config.roles.staff.admin],
  async execute(message, args) {
    const upperLimit = Number(args[0]);
    if (!Number.isSafeInteger(upperLimit) || upperLimit <= 0 || upperLimit >= Number.MAX_SAFE_INTEGER) {
      return message.reply('Provide a positive whole number for the upper limit. Example: `fh gtn 2500`.');
    }
    if (!message.channel.permissionOverwrites) return message.reply('This game requires a server channel with permission overwrites.');
    if (activeChannels.has(message.channel.id)) return message.reply('A Guess the Number game is already running in this channel.');
    activeChannels.add(message.channel.id);
    const everyone = message.guild.roles.everyone;
    const overwrite = message.channel.permissionOverwrites.cache.get(everyone.id);
    const originalSend = overwrite?.deny.has(PermissionFlagsBits.SendMessages) ? false :
      overwrite?.allow.has(PermissionFlagsBits.SendMessages) ? true : null;
    const randomNumber = Math.floor(Math.random() * (upperLimit + 1));
    let startMessage;
    let locked = false;
    try {
      await message.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
      locked = true;
      startMessage = await message.channel.send({
        embeds: [{
          title: 'Guess the Number!',
          description: `I chose a number between 0 and ${upperLimit.toLocaleString()}!\n\n${message.author}, click Start within 15 seconds. You have 15 minutes to guess.`,
          color: Theme.error
        }],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('Start').setCustomId('start;gtn').setStyle(ButtonStyle.Danger)
        )]
      });
      const button = await startMessage.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (interaction) => interaction.user.id === message.author.id && interaction.customId === 'start;gtn',
        time: 15_000
      }).catch((error) => {
        if (error.code === 'InteractionCollectorError') return null;
        throw error;
      });
      if (!button) {
        await message.channel.send('Guess the Number was cancelled because it was not started.');
        return;
      }
      await button.reply({ flags: 64, content: `The channel is opening. The number is: ${randomNumber}` });
      await startMessage.edit({ components: [] });
      await message.channel.permissionOverwrites.edit(everyone, { SendMessages: true });
      const guesses = await message.channel.awaitMessages({
        filter: (guess) => !guess.author.bot && /^\d+$/.test(guess.content.trim()) && Number(guess.content.trim()) === randomNumber,
        max: 1,
        time: 15 * 60 * 1000
      });
      const winner = guesses.first();
      if (winner) {
        await winner.reply({ embeds: [{
          title: 'The number has been guessed! 🎉',
          description: `The number was ${randomNumber}, and it was guessed by ${winner.author}.`,
          timestamp: new Date()
        }] });
      } else {
        await message.channel.send(`Time is up! The number was ${randomNumber}.`);
      }
    } finally {
      if (startMessage) await startMessage.edit({ components: [] }).catch(() => {});
      try {
        if (locked) await message.channel.permissionOverwrites.edit(everyone, { SendMessages: originalSend });
      } finally {
        activeChannels.delete(message.channel.id);
      }
    }
  }
};
