const { EmbedBuilder, Colors } = require('discord.js');
const { CoinService } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');

module.exports = {
  name: 'numbergame',
  aliases: ['ng', 'num'],

  async execute(message, args, client) {
    if (cooldowns.isLocked(message.author.id))
      return message.reply('Youre already running a command');

    const amount = parseAmount(args[0] || 'hrish');
    if (!amount) return message.reply('Invalid amount');

    const balance = await CoinService.getBalance(message.author.id);
    if (amount > balance) return message.reply('Not enough coins');

    cooldowns.lock(message.author.id);
    await CoinService.removeCoins(message.author.id, amount);

    const data = {
      def: amount,
      rand: Math.floor(Math.random() * 100) + 1,
      max_win: amount * 10
    };

    const infoEmbed = new EmbedBuilder()
      .setTitle('Guess the Number [1-100]')
      .setDescription(
        `**Current Win Amount: ${data.max_win.toLocaleString()}**\nAmount bet: ${data.def.toLocaleString()}`
      )
      .addFields([
        {
          inline: true,
          name: 'Rules',
          value: '- You start with __10x__ your bet amount (1,000 => 10,000)\n- Every wrong guess reduces your Win Amount by __50%__!\n- When you guess the correct number, you win/lose the __Current Win Amount__ above.\n- The bot tells you if the number is higher or lower than your guess.'
        }
      ])
      .setColor(Colors.Gold)
      .setFooter({ text: 'Gambling is good for your health!' });

    message.reply({
      content: 'Guess the number between 1 and 100',
      embeds: [infoEmbed]
    });

    const collector = message.channel.createMessageCollector({
      filter: (i) => i.author.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (msg) => {
      infoEmbed.setFields([]);
      if (!parseAmount(msg.content)) {
        cooldowns.unlock(message.author.id);
        return msg.reply('Not a number!');
      }
      if (data.max_win < 1) {
        cooldowns.unlock(message.author.id);
        collector.stop();
        return message.reply({
          content: 'You lost ' + data.def.toLocaleString() + ' coins :('
        });
      }
      if (msg.content == data.rand) {
        await CoinService.addCoins(message.author.id, data.max_win);
        msg.reply({
          content:
            amount > data.max_win
              ? 'You guessed the number but you lost ' +
                (amount - data.max_win).toLocaleString() +
                ' coins!'
              : `You guessed it! You won ${data.max_win.toLocaleString()}!`
        });
        cooldowns.unlock(message.author.id);
        collector.stop();
      } else {
        data.max_win = Math.floor(data.max_win / 2);
        const hl = Number(msg.content) > Number(data.rand) ? 'lower' : 'higher';
        infoEmbed.setDescription(
          `**Current Win Amount: ${data.max_win.toLocaleString()}**\nAmount bet: ${data.def.toLocaleString()}`
        );
        msg.reply({
          content: `The number is **${hl}** than **${msg.content}**. Try again!`,
          embeds: [infoEmbed]
        });
      }
    });

    collector.on('end', () => {
      cooldowns.unlock(message.author.id);
    });
  }
};
