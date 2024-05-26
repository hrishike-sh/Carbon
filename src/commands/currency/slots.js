const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
let cd = [];
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
      return message.reply({
        embeds: [
          {
            title: 'Slots Table',
            color: Colors.Green,
            timestamp: new Date(),
            description:
              '> <:fh_crown:911256459998797854><:fh_crown:911256459998797854><:fh_crown:911256459998797854> ~ 10x\n🏆🏆🏆 ~ 5x\n<:fh_medal:924283224593661962><:fh_medal:924283224593661962><:fh_medal:924283224593661962> ~ 4x\n💰💰💰 ~ 2x\n:dollar::dollar::dollar: ~ 1.5x'
          }
        ]
      });
    }
    if (!amount || !parseAmount(amount)) {
      return message.reply('Provide a valid number.');
    }

    amount = parseAmount(amount);
    if (amount > user.coins) {
      return message.reply('You dont have that typa money.');
    }
    if (amount < 100) return message.reply('Minimum bet is 100.');
    if (amount > 100_000) return message.reply('Maximum bet is 100,000!');
    if (cd.includes(userId)) {
      return message.reply('You can run this command once every 10 seconds.');
    }
    addCd(userId);
    removeCoins(userId, amount);
    console.log('==========================================');
    let map = [
      '<:fh_crown:911256459998797854>',
      '🏆',
      '<:fh_medal:924283224593661962>',
      '💰',
      ':dollar:'
    ];
    // 10x 5x 4x 2x 1.5x
    const rand = Math.random();
    console.log('Random number:', rand);
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
      [
        '<:fh_crown:911256459998797854>',
        '🏆',
        '<:fh_medal:924283224593661962>',
        '💰',
        ':dollar:'
      ]
        .sort(() => Math.random() - 0.5)
        .splice(0, 3)
        .forEach((e) => {
          slots.push(e);
        });
      multi = 0;
    }
    console.log('Multi:', multi);
    addCoins(userId, amount * multi);
    let d =
      '<a:aleft:1244308430437744730><a:slotspin:1244291354993885316><a:slotspin:1244291354993885316><a:slotspin:1244291354993885316><a:aright:1244308478223319075>';
    const slotBed = new EmbedBuilder()
      .setDescription(d)
      .setColor(Colors.Yellow);
    const slotMessage = await message.reply({
      embeds: [slotBed]
    });
    await sleep(1000);
    console.log('Slots:', ...slots);
    for (let p = 0; p < 3; p++) {
      d = d.replace('<a:slotspin:1244291354993885316>', slots[p]);
      await sleep(1000);
      slotBed.setDescription(d);
      slotMessage.edit({
        embeds: [slotBed]
      });
    }
    await sleep(500);
    const m =
      multi == 0
        ? `${
            message.author.tag
          }, you lost <:token:1003272629286883450> **${amount.toLocaleString()}** :(`
        : `${message.author.tag}, you won <:token:1003272629286883450> **${(
            amount * multi
          ).toLocaleString()}** coins!!`;
    slotMessage.channel.send(m);
    console.log('==========================================');
  }
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
const addCd = async (userId) => {
  cd.push(userId);
  await sleep(10000);
  cd = cd.filter((a) => a != userId);
};
