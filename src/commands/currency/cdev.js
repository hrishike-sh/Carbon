const { Message, Client } = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'currencydev',
  aliases: ['cdev'],
  /**
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (message.author.id !== '598918643727990784') return;
    if (!args[0])
      // fh cdev <user> del/add/remove/ <amount>
      return message.reply(`fh cdev **<user>** del/add/remove/ <amount>`);
    const userId = args[0];
    if (!client.users.fetch(userId)) {
      return message.reply(`fh cdev **<user>** del/add/remove/ <amount>`);
    }
    args.shift();
    const what = args[0].toLowerCase();
    switch (what) {
      case 'del':
      case 'delete':
        try {
          await Database.deleteOne({
            userId
          });
        } catch (e) {
          message.reply('Error: ' + e.message);
        } finally {
          message.react('✅');
        }
        break;
      case 'add':
      case '+':
        args.shift();
        const amount = parseAmount(args[0]);
        if (!amount)
          return message.reply(
            'fh cdev <user> del/__add__/remove/ **<amount>**'
          );
        addCoins(userId, amount);
        message.react('✅');
        break;
      case 'remove':
      case '-':
        args.shift();
        const Ramount = parseAmount(args[0]);
        if (!Ramount)
          return message.reply(
            'fh cdev <user> del/add/__remove__/ **<amount>**'
          );
        removeCoins(userId, amount);
        message.react('✅');
        break;
    }
  }
};
/**
 * DB Functions
 */
const removeCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins -= Number(amount);
  user.save();
};
const addCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins += amount;
  user.save();
};

const getUser = async (userId) => {
  let dbu = await Database.findOne({
    userId
  });
  if (!dbu) {
    dbu = new Database({
      userId,
      coins: 0
    });
  }
  return dbu;
};

/**
 * DB Functions
 */

const parseAmount = (string) => {
  // Checks if first digit is valid number
  if (isNaN(string[0])) return null;

  // Return if number is like "5e4" etc.
  if (!isNaN(Number(string))) return Number(string);

  // Check for "m", "k" etc. and return value
  if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
    return null;

  // Add values of m, k and b
  const val = string[string.length - 1];
  const rawString = string.replace(string[string.length - 1], '');
  const calculated = parseInt(rawString) * StringValues[val];

  // Invalid number
  if (isNaN(calculated)) return null;
  else return calculated;
};

const StringValues = {
  m: 1e6,
  k: 1e3,
  b: 1e9
};
