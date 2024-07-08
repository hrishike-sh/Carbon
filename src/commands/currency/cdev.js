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
    // fh cdev <user> del/add/remove/ <amount>
    if (!(await client.antiBot(message))) return;
    const user =
      message.mentions.users.first() ||
      (await message.guild.members.fetch({ user: args[0] }).catch(() => null));
    if (!user) return message.reply('What are u doing');
    const action = args[1];
    const amount = parseAmount(args[2]);

    if (!action || !amount)
      return message.reply('Please provide an action and an amount');

    switch (action) {
      case 'add':
      case '+':
        await addCoins(user.id, amount);
        message.react('✅');
        break;
      case 'remove':
      case '-':
        await removeCoins(user.id, amount);
        message.react('✅');
        break;
      case 'del':
      case 'delete':
        (await getUser(user.id)).deleteOne({ userId: user.id });
        message.react('✅');
        break;
      default:
        message.reply('Invalid action');
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
