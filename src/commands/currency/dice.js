const { Message, Client, EmbedBuilder } = require('discord.js');
const Database = require('../../database/coins');
let cd = [];
module.exports = {
  name: 'dicegame',
  aliases: ['dice', 'dg', 'bet'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Invalid amount!');
    if (message.channel.parentId == '824313026248179782') {
      return message.react('❌');
    }
    if (message.guildId !== '824294231447044197') return;
    const userId = message.author.id;
    if (cd.includes(userId))
      return message.reply(
        'You can only use this command once every 5 seconds!'
      );
    if (client.cd.has(userId))
      return message.reply("You're already running a command!");

    const dbUser = await getUser(userId);
    if (dbUser.coins < amount)
      return message.reply("You don't have that much money!");
    if (amount > 10_000) return message.reply('You can only bet up to 10,000.');

    addCd(userId);
    client.cd.add(userId);

    const carbonRoll = Math.floor(Math.random() * 12) + 1;
    const playerRoll = Math.floor(Math.random() * 12) + 1;
    const winPercent = Math.floor(Math.random() * 75) + 25;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.member.displayName,
        iconURL: message.author.displayAvatarURL()
      })
      .setFields([
        {
          name: message.member.displayName,
          value: `Rolled: \`${playerRoll}\``,
          inline: true
        },
        {
          name: 'Carbon',
          value: `Rolled: \`${carbonRoll}\``,
          inline: true
        }
      ]);

    if (carbonRoll > playerRoll) {
      await removeCoins(userId, amount);
      embed.setColor('Red');
      embed.setDescription(
        `You lost: <:token:1003272629286883450> **${amount.toLocaleString()}**\n\nNew balance: <:token:1003272629286883450> ${Math.round(
          dbUser.coins - amount
        ).toLocaleString()}`
      );

      message.reply({ embeds: [embed] });
    } else if (playerRoll > carbonRoll) {
      const toAdd = Math.round(amount * (winPercent / 100));
      await addCoins(userId, toAdd);
      embed.setColor('Green');
      embed.setDescription(
        `You won: <:token:1003272629286883450> **${toAdd.toLocaleString()}**\nWin percent: ${winPercent}%\n\nNew balance: <:token:1003272629286883450> ${Math.round(
          dbUser.coins + toAdd
        ).toLocaleString()}`
      );

      message.reply({ embeds: [embed] });
    } else {
      embed.setColor('Yellow');
      embed.setDescription(
        `You tied!\n\nNew balance: <:token:1003272629286883450> ${Math.round(
          (await getUser(userId)).coins
        )}`
      );

      message.reply({ embeds: [embed] });
    }

    client.cd.delete(userId);
  }
};

const addCd = async (userId) => {
  cd.push(userId);
  await sleep(5_000);
  cd = cd.filter((a) => a != userId);
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
