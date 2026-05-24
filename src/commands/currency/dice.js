const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');

module.exports = {
  name: 'dicegame',
  aliases: ['dice', 'dg', 'bet'],
  cooldown: 5,

  async execute(message, args, client) {
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Invalid amount!');
    if (message.channel.parentId === config.ids.restrictedCategory) {
      return message.react('❌');
    }

    const userId = message.author.id;
    if (cooldowns.isLocked(userId)) {
      return message.reply("You're already running a command!");
    }

    if (amount > 10_000) return message.reply('You can only bet up to 10,000.');

    const balance = await CoinService.getBalance(userId);
    if (balance < amount) return message.reply("You don't have that much money!");

    cooldowns.lock(userId);

    const carbonRoll = Math.floor(Math.random() * 12) + 1;
    const playerRoll = Math.floor(Math.random() * 12) + 1;
    const winPercent = Math.floor(Math.random() * 75) + 25;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.member.displayName,
        iconURL: message.author.displayAvatarURL()
      })
      .setFields([
        { name: message.member.displayName, value: `Rolled: \`${playerRoll}\``, inline: true },
        { name: 'Carbon', value: `Rolled: \`${carbonRoll}\``, inline: true }
      ]);

    if (carbonRoll > playerRoll) {
      await CoinService.removeCoins(userId, amount);
      const newBalance = await CoinService.getBalance(userId);
      embed.setColor('Red');
      embed.setDescription(
        `You lost: <:token:${config.ids.emojis.token}> **${amount.toLocaleString()}**\n\nNew balance: <:token:${config.ids.emojis.token}> ${newBalance.toLocaleString()}`
      );
      message.reply({ embeds: [embed] });
    } else if (playerRoll > carbonRoll) {
      const toAdd = Math.round(amount * (winPercent / 100));
      await CoinService.addCoins(userId, toAdd);
      const newBalance = await CoinService.getBalance(userId);
      embed.setColor('Green');
      embed.setDescription(
        `You won: <:token:${config.ids.emojis.token}> **${toAdd.toLocaleString()}**\nWin percent: ${winPercent}%\n\nNew balance: <:token:${config.ids.emojis.token}> ${newBalance.toLocaleString()}`
      );
      message.reply({ embeds: [embed] });
    } else {
      embed.setColor('Yellow');
      embed.setDescription(
        `You tied!\n\nNew balance: <:token:${config.ids.emojis.token}> ${balance.toLocaleString()}`
      );
      message.reply({ embeds: [embed] });
    }

    cooldowns.unlock(userId);
  }
};
