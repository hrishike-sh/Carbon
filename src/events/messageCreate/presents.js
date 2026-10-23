const config = require('../../config');
const Database = require('../../database/models/presents-dec-24');

const CooldownSet = new Set();

module.exports = {
  name: 'presents',

  async execute(message) {
    if (message.guild.id !== config.ids.guildId) return;

    const userId = message.author.id;
    if (CooldownSet.has(userId)) return;

    CooldownSet.add(userId);
    setTimeout(() => CooldownSet.delete(userId), 60_000);

    let amount = Math.floor(Math.random() * 15) + 5;
    if (message.channel.id === config.ids.channels.bonusCoin) {
      amount = Math.floor(amount * 1.5);
    }

    await Database.findOneAndUpdate(
      { userId },
      { $inc: { amount } },
      { upsert: true }
    );
  }
};
