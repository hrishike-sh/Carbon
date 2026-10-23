const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const Coin = require('../../database/models/coins');
const { sleep } = require('../../utils/helpers');

const cooldowns = new Set();

module.exports = {
  name: 'coins',

  async execute(message) {
    if (message.guild?.id !== config.ids.guildId) return;

    const userId = message.author.id;
    if (cooldowns.has(userId)) return;

    cooldowns.add(userId);
    setTimeout(() => cooldowns.delete(userId), 20_000);

    let amount = Math.ceil(Math.random() * 13) + 12;
    if (message.channel.id === config.ids.channels.bonusCoin) {
      amount = Math.floor(amount * 1.5);
    }

    await Coin.findOneAndUpdate(
      { userId },
      { $inc: { coins: amount } },
      { upsert: true }
    );
  }
};
