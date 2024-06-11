const Database = require('../../database/coins');
const { Message, Client } = require('discord.js');
const CD = {
  robbed: new Set(),
  robber: new Set()
};
module.exports = {
  name: 'rob',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   * @returns
   */
  async execute(message, args, client) {
    if (message.guild.id !== '824294231447044197') return;
    const target = message.mentions.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.id === message.author.id)
      return message.reply("You can't rob yourself!");
    const DBUSER = await getUser(message.author.id);
    const DBTARGET = await getUser(target.id);
    const MAX_AMOUNT =
      DBTARGET.coins > DBUSER.coins ? DBUSER.coins : DBTARGET.coins;
    if (CD.robbed.has(target.id))
      return message.reply(
        'Target has been robbed in the last 10 minutes, try again later.'
      );
    if (CD.robber.has(message.author.id))
      return message.reply(
        "You've robbed someone in the last 5 minutes already, take some rest."
      );

    const rand = Math.random();
    if (rand < 0.5) {
      robber(message.author.id);
      await removeCoins(message.author.id, MAX_AMOUNT);
      await addCoins(target.id, MAX_AMOUNT);
      (await target.createDM()).send(
        `${message.author.username} tried robbing you but gave you ${MAX_AMOUNT} coins!`
      );
      return message.reply(
        `You tried robbing ${target} but FAILED!!\nYou ended up giving ${target} **${DBUSER.coins.toLocaleString()}** coins <:pointandlaugh:1250074022843125760>`
      );
    } else if (rand < 0.7) {
      robber(message.author.id);
      robbed(target.id);
      await removeCoins(target.id, MAX_AMOUNT * 0.25);
      await addCoins(message.author.id, MAX_AMOUNT * 0.25);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${
          MAX_AMOUNT * 0.25
        } coins from you!`
      );
      return message.reply(
        `You robbed **${(
          MAX_AMOUNT * 0.25
        ).toLocaleString()}** coins from ${target}!`
      );
    } else if (rand < 0.9) {
      robber(message.author.id);
      robbed(target.id);
      await removeCoins(target.id, MAX_AMOUNT * 0.5);
      await addCoins(message.author.id, MAX_AMOUNT * 0.5);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${
          MAX_AMOUNT * 0.5
        } coins from you!`
      );
      return message.reply(
        `You robbed **${(
          MAX_AMOUNT * 0.5
        ).toLocaleString()}** coins from ${target}!`
      );
    } else {
      robber(message.author.id);
      robbed(target.id);
      await removeCoins(target.id, MAX_AMOUNT);
      await addCoins(message.author.id, MAX_AMOUNT);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${MAX_AMOUNT} coins from you!`
      );
      return message.reply(
        `You robbed **${MAX_AMOUNT.toLocaleString()}** coins from ${target}!`
      );
    }
  }
};

const robber = (id) => {
  CD.robber.add(id);
  setTimeout(() => CD.robber.delete(id), 5 * 60 * 1000);
};
const robbed = (id) => {
  CD.robbed.add(id);
  setTimeout(() => CD.robber.delete(id), 10 * 60 * 1000);
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
