const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
const Database = require('../../database/coins');
const cd = new Set();
module.exports = {
  name: 'memory',
  /**
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    let amount = args[0];
    if (!amount || !parseAmount(amount))
      return message.reply('Enter a valid bet.');

    amount = parseAmount(amount);
    const userId = message.author.id;
    const dbUser = await getUser(userId);
    if (dbUser.coins < amount) {
      return message.reply(`You don't have ${amount.toLocaleString()} coins.`);
    }
    if (cd.has(userId)) {
      return message.reply("You're already in a game!");
    }
    cd.add(userId);
    // await removeCoins(userId, amount);
    const emojis = [
      '😃',
      '🥹',
      '😂',
      '😇',
      '😌',
      '🙂',
      '🙃',
      '🤪',
      '😜',
      '🥺'
    ].sort(() => Math.random() - 0.5);

    const flow = emojis.slice(0, 5);
    const embed = new EmbedBuilder()
      .setTitle('Memory Game')
      .setColor(Colors.Yellow)
      .setFooter({
        text: `Your bet: ${amount.toLocaleString()}`
      })
      .setDescription(
        'The game will start in 2 seconds, click the emojis in correct order later on!'
      );
    await sleep(2000);
    const msg = await message.reply({
      embeds: [embed]
    });
    for (let i = 0; i < 5; i++) {
      embed.setDescription(`${flow[i]}`);
      await msg.edit({
        embeds: [embed]
      });
      await sleep(500);
    }

    cd.delete(userId);
  }
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
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
const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 4) {
    chunks.push(array.slice(i, i + 4));
  }
  return chunks;
};
