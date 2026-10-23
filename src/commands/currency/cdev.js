const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const { parseAmount } = require('../../utils/validators');

module.exports = {
  name: 'currencydev',
  aliases: ['cdev'],

  async execute(message, args, client) {
    if (!config.ids.devUserIds.includes(message.author.id)) return;

    const actions = ['add', '+', 'remove', '-', 'del', 'delete'];
    const firstArg = args[0]?.toLowerCase();
    const actionFirst = actions.includes(firstArg);
    const action = actionFirst ? firstArg : args[1]?.toLowerCase();
    const userArg = actionFirst ? args[1] : args[0];
    const amountArg = args[2];

    const userId = userArg?.replace(/[^0-9]/g, '');
    const user =
      message.mentions.users.first() ||
      (userId ? (await message.guild.members.fetch(userId).catch(() => null))?.user : null);
    if (!user) return message.reply('What are u doing');

    if (!action) return message.reply('Please provide an action');

    const amount = parseAmount(amountArg);
    if (!['del', 'delete'].includes(action) && !amount)
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
