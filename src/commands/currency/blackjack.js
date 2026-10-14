const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const antiBot = require('../../client/AntiBot');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');
const logger = require('../../utils/logger');
const { createDeck, shuffleDeck, drawCard, calculateScore, formatHand } = require('./lib/blackjack');

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  cooldown: 5,

  async execute(message, args) {
    if (!(await antiBot.check(message))) return;
    if (message.channel.parentId === config.ids.restrictedCategory) return message.react('❌');

    const userId = message.author.id;
    const bet = args[0] === undefined ? 1 : parseAmount(args[0]);
    if (!bet) return message.reply('Invalid amount!');
    if (bet > 25000) return message.reply('You cannot bet more than 25,000 coins!');
    if (!cooldowns.lock(userId)) return message.reply("You're already running a command!");

    let debited = false;
    try {
      await CoinService.removeCoins(userId, bet);
      debited = true;
      const deck = createDeck();
      shuffleDeck(deck);
      const playerHand = [drawCard(deck), drawCard(deck)];
      const botHand = [drawCard(deck), drawCard(deck)];
      const embed = new EmbedBuilder()
        .setTitle('Blackjack')
        .setColor(Theme.warning)
        .setFooter({ text: 'Carbon • Good luck!' });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('hit').setLabel('Hit'),
        new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('stand').setLabel('Stand')
      );

      function showHands(hidden) {
        embed.setFields(
          {
            name: message.member.displayName,
            value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(playerHand)}`,
            inline: true
          },
          {
            name: 'Carbon',
            value: `Hand: ${formatHand(botHand, hidden)}\nScore: ${calculateScore(botHand, hidden)}${hidden ? '+' : ''}`,
            inline: true
          }
        );
      }
      showHands(true);
      const msg = await message.reply({ embeds: [embed], components: [row] });
      const collector = msg.createMessageComponentCollector({
        filter: (button) => button.user.id === userId,
        idle: 30_000
      });
      let finished = false;
      let busy = false;

      async function settle(payout, content, color) {
        finished = true;
        collector.stop('settled');
        try {
          if (payout > 0) await CoinService.addCoins(userId, payout);
          showHands(false);
          embed.setColor(color);
          row.components.forEach((button) => button.setDisabled(true));
          await msg.edit({ embeds: [embed], components: [row], content });
        } finally {
          cooldowns.unlock(userId);
        }
      }

      collector.on('collect', (button) => {
        if (finished || busy) {
          button.deferUpdate().catch((err) => logger.error('Failed to acknowledge blackjack button', err));
          return;
        }
        busy = true;
        (async () => {
          await button.deferUpdate();
          if (finished) return;
          if (button.customId === 'hit') {
            playerHand.push(drawCard(deck));
            if (calculateScore(playerHand) > 21) {
              return settle(0, `You busted! You lost **${bet.toLocaleString()}** coins!`, Theme.error);
            }
            if (calculateScore(botHand) < 17) botHand.push(drawCard(deck));
            if (calculateScore(botHand) > 21) {
              return settle(bet * 2, `The dealer busted, you won **${bet.toLocaleString()}** coins!`, Theme.success);
            }
            showHands(true);
            await msg.edit({ embeds: [embed], components: [row] });
            return;
          }
          if (button.customId !== 'stand') return;
          while (calculateScore(botHand) < 17) botHand.push(drawCard(deck));
          const playerScore = calculateScore(playerHand);
          const botScore = calculateScore(botHand);
          if (botScore > 21 || playerScore > botScore) {
            return settle(bet * 2, `You won ${bet.toLocaleString()} coins!`, Theme.success);
          }
          if (playerScore === botScore) return settle(bet, "It's a tie!", Theme.warning);
          return settle(0, `You lost ${bet.toLocaleString()} coins!`, Theme.error);
        })().catch((err) => {
          logger.error('Blackjack game failed', err);
          collector.stop('error');
        }).finally(() => { busy = false; });
      });

      collector.once('end', (_, reason) => {
        if (reason === 'settled') return;
        finished = true;
        cooldowns.unlock(userId);
        row.components.forEach((button) => button.setDisabled(true));
        msg.edit({
          components: [row],
          content: reason === 'idle' ? 'The game expired.' : 'The game has ended.'
        }).catch((err) => logger.error('Failed to close blackjack game', err));
      });
    } catch (err) {
      try {
        if (debited) await CoinService.addCoins(userId, bet);
      } finally {
        cooldowns.unlock(userId);
      }
      if (err instanceof InsufficientFundsError) return message.reply('You do not have enough coins!');
      throw err;
    }
  }
};
