const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'slots',
  aliases: ['sl'],
  /**
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const userId = message.author.id;
    const user = await getUser(userId);
    let amount = args.shift();
    if (amount && amount.toLowerCase() == 'table') {
      return message.reply({});
    }
    if (!amount || !parseAmount(amount)) {
      return message.reply('Provide a valid number.');
    }

    amount = parseAmount(amount);
    if (amount > user.coins) {
      return message.reply('You dont have that typa money.');
    }
    if (amount < 100) return message.reply('Minimum bet is 100.');
    // removeCoins(userId, amount);
    let map = [':fh_crown:', '🏆', ':fh_medal:', '💰', ':dollar:'];
    // 10x 5x 4x 2x 1.5x
    const rand = Math.random();
    const slots = [];
    let multi = 1;
    if (rand < 0.01) {
      // 10x 1%
      slots.push(map[0]);
      slots.push(map[0]);
      slots.push(map[0]);
      multi = 10;
    } else if (rand < 0.025) {
      // 5x 2.5%
      slots.push(map[1]);
      slots.push(map[1]);
      slots.push(map[1]);
      multi = 5;
    } else if (rand < 0.05) {
      // 4x 5%
      slots.push(map[2]);
      slots.push(map[2]);
      slots.push(map[2]);
      multi = 4;
    } else if (rand < 0.2) {
      // 2x 20%
      slots.push(map[3]);
      slots.push(map[3]);
      slots.push(map[3]);
      multi = 2;
    } else if (rand < 0.4) {
      // 1.5x 20%
      slots.push(map[4]);
      slots.push(map[4]);
      slots.push(map[4]);
      multi = 1.5;
    } else {
      for (let i = 0; i < 2; i++) {
        const elem = map[Math.ceil(Math.random() * map.length)];
        slots.push(elem);
        map = map.filter((e) => e != elem);
      }
    }

    const slotBed = new EmbedBuilder()
      .setDescription(
        '<a:aleft:1244308430437744730><a:slotspin:1244291354993885316><a:slotspin:1244291354993885316><a:slotspin:1244291354993885316><a:aright:1244308478223319075>'
      )
      .setColor(Colors.Yellow);

    const slotMessage = await message.reply({
      embeds: [slotBed]
    });
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
