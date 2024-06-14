const { Message, Client } = require('discord.js');
const Database = require('../../database/coins');
const cd = new Set();
module.exports = {
  name: 'share',
  aliases: ['give', 'send'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target = message.mentions.members?.first() || null;
    if (!target) return message.reply('You have to mention someone!');
    args.shift();
    if (target.id == message.author.id)
      return message.reply("You can't share coins with yourself!");
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Invalid amount!');
    if (client.cd.has(message.author.id))
      return message.reply('Youre already running a command');

    if (
      [
        '824313259976556544',
        '824313275750547456',
        '824313288967192597',
        '824313306633863278',
        '824318942511890452',
        '828201384910258186',
        '828201396334755860',
        '832893535509676093',
        '870240187198885888',
        '848939463404552222',
        '857629233152786442',
        '858295915428315136'
      ].includes(message.channel.id)
    ) {
      return message.react('❌');
    }
    const DBUSER = await getUser(message.author.id);
    if (DBUSER.coins < amount)
      return message.reply('You dont have that many coins!');
    if (cd.has(message.author.id || target.user.id))
      return message.reply('You are already sharing coins!');
    cd.add(message.author.id);
    cd.add(target.user.id);
    await removeCoins(message.author.id, amount);
    await addCoins(target.user.id, amount);
    await message.reply(
      `You gave ${target.toLocaleString().split('.')[0]} ${amount} coins!`
    );
    cd.delete(message.author.id);
    cd.delete(target.user.id);
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
  user.coins += Number(amount);
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
const addCd = async (userId) => {
  cd.push(userId);
  await sleep(5000);
  cd = cd.filter((a) => a != userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
