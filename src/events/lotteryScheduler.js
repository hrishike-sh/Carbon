const { startLotteryScheduler } = require('../services/lotteryService');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    await startLotteryScheduler(client);
  }
};
