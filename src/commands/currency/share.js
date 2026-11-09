const { CoinService } = require('../../database/services/coinService');
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

    const balance = await CoinService.getBalance(message.author.id);
    if (balance < amount)
      return message.reply('You dont have that many coins!');

    await CoinService.transfer(message.author.id, target.id, amount);

    await message.reply(
      `You gave ${target.toString()} ${amount.toLocaleString()} coins!`
    );
  }
};
