const { Message, Client } = require('discord.js');
const Database = require('../database/presents-dec-24');
const CooldownSet = new Set();
module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message discord message
   * @param {Client} client client
   */
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.guild.id !== '824294231447044197') return;
    const userId = message.author.id;
    if (CooldownSet.has(userId)) return;
    addCd(userId);
    let amount = Math.floor(Math.random() * 15) + 5;
    if (message.channel.id == '1256504358615519284') {
      amount *= 1.5;
    }
    await Database.findOneAndUpdate(
      {
        userId
      },
      {
        $inc: {
          amount: amount
        }
      },
      {
        upsert: true
      }
    );
  }
};

const addCd = async (userId) => {
  CooldownSet.add(userId);
  await sleep(60_000);
  CooldownSet.delete(userId);
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
