const { Message } = require('discord.js');
const Database = require('../database/coins');
let List = [];
module.exports = {
  name: 'messageCreate',
  /**
   * @param {Message} message
   */
  async execute(message) {
    const client = message.client;
    const userId = message.author.id;

    /**
     * Checks
     */
    if (message.guild?.id !== '824294231447044197') return;
    if (message.author?.bot) return;
    if (List.includes(userId)) return;
    /**
     * Checks
     */

    addList(userId);
    addCoins(userId, Math.ceil(Math.random() * 13) + 12);
  }
};

const addList = async (userId) => {
  List.push(userId);
  await sleep(20_000);
  List = List.filter((a) => a != userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/**
 * DB Functions
 */

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
