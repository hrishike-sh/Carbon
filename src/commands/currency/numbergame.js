const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');
const { warningEmbed } = require('../../utils/embeds');
const logger = require('../../utils/logger');

module.exports = {
  name: 'numbergame',
  aliases: ['ng', 'num'],

  async execute(message, args) {
    const userId = message.author.id;
    const amount = parseAmount(args[0]);
    if (!amount || !Number.isSafeInteger(amount * 10)) return message.reply('Invalid amount');
    if (!cooldowns.lock(userId)) return message.reply('Youre already running a command');

    let debited = false;
    try {
      await CoinService.removeCoins(userId, amount);
      debited = true;
      const answer = Math.floor(Math.random() * 100) + 1;
      let prize = amount * 10;
      let finished = false;
      const embed = warningEmbed({
        title: 'Guess the Number [1-100]',
        description: `**Current Win Amount: ${prize.toLocaleString()}**\nAmount bet: ${amount.toLocaleString()}`,
        fields: [{
          inline: true,
          name: 'Rules',
          value: '- You start with __10x__ your bet amount (1,000 => 10,000)\n- Every wrong guess reduces your Win Amount by __50%__!\n- When you guess the correct number, you win/lose the __Current Win Amount__ above.\n- The bot tells you if the number is higher or lower than your guess.'
        }],
        footer: 'Good luck!'
      });

      await message.reply({ content: 'Guess the number between 1 and 100', embeds: [embed] });
      const collector = message.channel.createMessageCollector({
        filter: (msg) => msg.author.id === userId,
        time: 60000
      });

      collector.on('collect', (msg) => {
        if (finished) return;
        (async () => {
          const input = msg.content.trim();
          const guess = /^\d{1,3}$/.test(input) ? Number(input) : NaN;
          if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
            await msg.reply('Enter a whole number between 1 and 100.');
            return;
          }
          embed.setFields([]);

          if (guess === answer) {
            // Claim the result before the asynchronous payout so two answers
            // received together cannot both award the prize.
            finished = true;
            collector.stop('won');
            try {
              await CoinService.addCoins(userId, prize);
              await msg.reply({
                content: amount > prize
                  ? `You guessed the number but you lost ${(amount - prize).toLocaleString()} coins!`
                  : `You guessed it! You won ${prize.toLocaleString()}!`
              });
            } finally {
              cooldowns.unlock(userId);
            }
          } else {
            prize = Math.floor(prize / 2);
            if (prize < 1) {
              finished = true;
              collector.stop('lost');
              await msg.reply(`You lost ${amount.toLocaleString()} coins :(`);
              return;
            }
            embed.setDescription(
              `**Current Win Amount: ${prize.toLocaleString()}**\nAmount bet: ${amount.toLocaleString()}`
            );
            await msg.reply({
              content: `The number is **${guess > answer ? 'lower' : 'higher'}** than **${guess}**. Try again!`,
              embeds: [embed]
            });
          }
        })().catch((err) => {
          logger.error('Number game failed', err);
          finished = true;
          collector.stop('error');
        });
      });

      collector.once('end', (_, reason) => {
        finished = true;
        if (reason !== 'won') cooldowns.unlock(userId);
      });
    } catch (err) {
      try {
        if (debited) await CoinService.addCoins(userId, amount);
      } finally {
        cooldowns.unlock(userId);
      }
      if (err instanceof InsufficientFundsError) return message.reply('Not enough coins');
      throw err;
    }
  }
};
