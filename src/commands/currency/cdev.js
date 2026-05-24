const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const { parseAmount } = require('../../utils/validators');

module.exports = {
  name: 'currencydev',
  aliases: ['cdev'],

  async execute(message, args, client) {
    if (message.author.id !== config.ids.devUserIds[0]) return;

    const user =
      message.mentions.users.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null))?.user;
    if (!user) return message.reply('What are u doing');
    const action = args[1];
    const amount = parseAmount(args[2]);

    if (!action || !amount)
      return message.reply('Please provide an action and an amount');

    switch (action) {
      case 'add':
      case '+':
        await CoinService.addCoins(user.id, amount);
        message.react('✅');
        break;
      case 'remove':
      case '-':
        await CoinService.removeCoins(user.id, amount).catch(() => {});
        message.react('✅');
        break;
      case 'del':
      case 'delete':
        await CoinService.wipeUser(user.id);
        message.react('✅');
        break;
      default:
        message.reply('Invalid action');
    }
  }
};
