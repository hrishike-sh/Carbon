const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const config = require('../../config');
const { parseAmount } = require('../../utils/validators');
const cooldowns = require('../../command/cooldowns');

module.exports = {
  name: 'share',
  aliases: ['give', 'send'],

  async execute(message, args, client) {
    const target = message.mentions.members?.first();
    if (!target) return message.reply('You have to mention someone!');
    args.shift();
    if (target.id === message.author.id)
      return message.reply("You can't share coins with yourself!");
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Invalid amount!');
    if (cooldowns.isLocked(message.author.id))
      return message.reply('Youre already running a command');

    if (config.ids.restrictedCurrencyChannels.includes(message.channel.id)) {
      return message.react('❌');
    }

    try {
      await CoinService.transfer(message.author.id, target.id, amount);
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        return message.reply('You dont have that many coins!');
      }
      throw err;
    }

    await message.reply(
      `You gave ${target.toString()} ${amount.toLocaleString()} coins!`
    );
  }
};
