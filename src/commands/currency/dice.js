const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');

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

    if (!cooldowns.lock(userId)) return message.reply("You're already running a command!");
    let reserved = false;
    let settlementStarted = false;
    try {
      // Reserve the stake atomically before rolling. A transfer already in
      // flight cannot make a winning bet free or a losing bet unpayable.
      const { coins: balance } = await CoinService.removeCoins(userId, amount);
      reserved = true;

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
        settlementStarted = true;
        embed.setColor(Theme.error);
        embed.setDescription(
          `You lost: <:token:${config.ids.emojis.token}> **${amount.toLocaleString()}**\n\nNew balance: <:token:${config.ids.emojis.token}> ${balance.toLocaleString()}`
        );
        await message.reply({ embeds: [embed] });
      } else if (playerRoll > carbonRoll) {
        const toAdd = Math.round(amount * (winPercent / 100));
        settlementStarted = true;
        const { coins: newBalance } = await CoinService.addCoins(userId, amount + toAdd);
        embed.setColor(Theme.success);
        embed.setDescription(
          `You won: <:token:${config.ids.emojis.token}> **${toAdd.toLocaleString()}**\nWin percent: ${winPercent}%\n\nNew balance: <:token:${config.ids.emojis.token}> ${newBalance.toLocaleString()}`
        );
        await message.reply({ embeds: [embed] });
      } else {
        settlementStarted = true;
        const { coins: newBalance } = await CoinService.addCoins(userId, amount);
        embed.setColor(Theme.warning);
        embed.setDescription(
          `You tied!\n\nNew balance: <:token:${config.ids.emojis.token}> ${newBalance.toLocaleString()}`
        );
        await message.reply({ embeds: [embed] });
      }

    } catch (err) {
      // Refund local setup failures only. Once settlement starts, an uncertain
      // write result or failed reply must not trigger a duplicate credit.
      if (reserved && !settlementStarted) await CoinService.addCoins(userId, amount);
      if (err instanceof InsufficientFundsError) {
        return await message.reply("You don't have that much money!");
      }
      throw err;
    } finally {
      cooldowns.unlock(userId);
    }
  }
};
