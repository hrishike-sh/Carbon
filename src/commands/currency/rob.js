const Database = require('../../database/coins');
const { Message, Client, Collection } = require('discord.js');
const CD = {
  robbed: new Collection(),
  robber: new Collection()
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

    if (
      CD.robber.has(message.author.id) &&
      CD.robber.get(message.author.id).time > Date.now()
    )
      return message.reply(
        "You've robbed in the last 5 minutes!" +
          `\nTry again <t:${(
            (CD.robber.get(message.author.id).time - Date.now()) /
            1000
          ).toFixed(0)}:R>.`
      );
    if (CD.robbed.has(target.id) && CD.robbed.get(target.id).time > Date.now())
      return message.reply(
        `${target} has been robbed in the last 10 minutes.\nTry again <t:${(
          (CD.robber.get(target.id).time - Date.now()) /
          1000
        ).toFixed(0)}:R>`
      );
    const rand = Math.random();
    if (rand < 0.5) {
      CD.robber.set(message.author.id, { time: Date.now() + 5 * 60 * 1000 });
      await removeCoins(message.author.id, MAX_AMOUNT);
      await addCoins(target.id, MAX_AMOUNT);
      (await target.createDM()).send(
        `${message.author.username} tried robbing you but gave you ${
          MAX_AMOUNT.toLocaleString().split('.')[0]
        } coins!`
      );
      return message.reply(
        `You tried robbing ${target} but FAILED!!\nYou ended up giving ${target} **${
          DBUSER.coins.toLocaleString().split('.')[0]
        }** coins <:pointandlaugh:1250074022843125760>`
      );
    } else if (rand < 0.7) {
      CD.robber.set(message.author.id, { time: Date.now() + 5 * 60 * 1000 });
      CD.robbed.set(target.id, { time: Date.now() + 10 * 60 * 1000 });
      await removeCoins(target.id, MAX_AMOUNT * 0.25);
      await addCoins(message.author.id, MAX_AMOUNT * 0.25);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${
          (MAX_AMOUNT * 0.25).toLocaleString().split('.')[0]
        } coins from you! (25% of max)`
      );
      return message.reply(
        `You robbed **${
          (MAX_AMOUNT * 0.25).toLocaleString().split('.')[0]
        }** coins from ${target}! (25% of max)`
      );
    } else if (rand < 0.9) {
      CD.robber.set(message.author.id, { time: Date.now() + 5 * 60 * 1000 });
      CD.robbed.set(target.id, { time: Date.now() + 10 * 60 * 1000 });
      await removeCoins(target.id, MAX_AMOUNT * 0.5);
      await addCoins(message.author.id, MAX_AMOUNT * 0.5);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${
          (MAX_AMOUNT * 0.5).toLocaleString().split('.')[0]
        } coins from you! (50% of max)`
      );
      return message.reply(
        `You robbed **${
          (MAX_AMOUNT * 0.5).toLocaleString().split('.')[0]
        }** coins from ${target}! (50% of max)`
      );
    } else {
      CD.robber.set(message.author.id, { time: Date.now() + 5 * 60 * 1000 });
      CD.robbed.set(target.id, { time: Date.now() + 10 * 60 * 1000 });
      await removeCoins(target.id, MAX_AMOUNT);
      await addCoins(message.author.id, MAX_AMOUNT);
      (await target.createDM()).send(
        `${message.author.username} has robbed ${
          MAX_AMOUNT.toLocaleString().split('.')[0]
        } coins from you! (100% of max)`
      );
      return message.reply(
        `You robbed **${
          MAX_AMOUNT.toLocaleString().split('.')[0]
        }** coins from ${target}! (100% of max)`
      );
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
