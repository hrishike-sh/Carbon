const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');

const cooldowns = new Set();

module.exports = {
  name: 'coins',

  async execute(message) {
    if (message.guild?.id !== config.ids.guildId) return;

    const userId = message.author.id;
    if (cooldowns.has(userId)) return;

    cooldowns.add(userId);
    setTimeout(() => cooldowns.delete(userId), 20_000).unref();

    let amount = Math.ceil(Math.random() * 13) + 12;
    if (message.channel.id === config.ids.channels.bonusCoin) {
      amount = Math.floor(amount * 1.5);
    }

    await CoinService.addCoins(userId, amount);
  }
};
