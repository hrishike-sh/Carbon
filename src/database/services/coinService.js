const Coin = require('../models/coins');
const logger = require('../../utils/logger');

class CoinService {
  async getUser(userId) {
    let doc = await Coin.findOne({ userId });
    if (!doc) {
      doc = new Coin({ userId, coins: 0 });
      await doc.save();
    }
    return doc;
  }

  async getBalance(userId) {
    const doc = await this.getUser(userId);
    return doc.coins;
  }

  async addCoins(userId, amount) {
    const doc = await Coin.findOneAndUpdate(
      { userId },
      { $inc: { coins: Math.floor(amount) } },
      { upsert: true, new: true }
    );
    return doc;
  }

  async removeCoins(userId, amount) {
    amount = Math.floor(amount);
    const doc = await Coin.findOneAndUpdate(
      { userId, coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true }
    );
    if (!doc) {
      throw new InsufficientFundsError(userId, amount);
    }
    return doc;
  }

  async hasEnough(userId, amount) {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  async transfer(senderId, recipientId, amount) {
    await this.removeCoins(senderId, amount);
    await this.addCoins(recipientId, amount);
  }

  async getLeaderboard(limit = 10) {
    return Coin.find({ coins: { $gt: 0 } })
      .sort({ coins: -1 })
      .limit(limit);
  }

  async wipeUser(userId) {
    return Coin.deleteOne({ userId });
  }
}

class InsufficientFundsError extends Error {
  constructor(userId, amount) {
    super(`User ${userId} has insufficient funds for ${amount}`);
    this.name = 'InsufficientFundsError';
    this.userId = userId;
    this.amount = amount;
  }
}

module.exports = { CoinService: new CoinService(), InsufficientFundsError };
