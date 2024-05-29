const { Message, Client, Colors } = require('discord.js');
const Database = require('../../database/coins');
let cd = [];
module.exports = {
  name: 'coinflip',
  aliases: ['cf'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    if (message.guildId !== '824294231447044197') return;
    const userId = message.author.id;
    let amount = args.shift();
    if (!amount || !parseAmount(amount)) {
      return message.reply('Try using a number next time.');
    }
    amount = parseAmount(amount);
    const user = await getUser(userId);
    if (user.coins < amount) {
      return message.reply('u dont have that many coins brokie');
    }
    if (cd.includes(userId)) {
      return message.reply({
        embeds: [
          {
            author: {
              icon_url: message.author.displayAvatarURL(),
              name: message.author.username
            },
            footer: {
              text: 'Get a job'
            },
            description: 'You can run this command every 5 seconds!'
          }
        ]
      });
    }
    addCd(userId);

    if (Math.random() < 0.5) {
      removeCoins(userId, amount);
      message.reply({
        embeds: [
          {
            author: {
              name: message.author.username,
              icon_url: message.author.displayAvatarURL()
            },
            color: Colors.Red,
            description: 'You **lost** ' + amount.toLocaleString() + '.'
          }
        ]
      });
    } else {
      addCoins(userId, amount);
      message.reply({
        embeds: [
          {
            author: {
              name: message.author.username,
              icon_url: message.author.displayAvatarURL()
            },
            color: Colors.Green,
            description: 'You **won** ' + amount.toLocaleString() + '!!'
          }
        ]
      });
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
