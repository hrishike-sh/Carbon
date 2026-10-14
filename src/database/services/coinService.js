const Coin = require('../models/coins');

function normaliseAmount(amount) {
  const value = Math.floor(Number(amount));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('Coin amount must be a positive safe integer');
  }
  return value;
}

class CoinService {
  constructor() {
    this._pendingUpserts = new Map();
  }

  async getUser(userId) {
    return this._upsert(userId, { $setOnInsert: { coins: 0 } });
  }

  async getBalance(userId) {
    const doc = await Coin.findOne({ userId }).select({ coins: 1 }).lean();
    return doc?.coins ?? 0;
  }

  async addCoins(userId, amount) {
    amount = normaliseAmount(amount);
    return this._upsert(userId, { $inc: { coins: amount } });
  }

  async _upsert(userId, update) {
    // Serialize first-use upserts in this bot process. A unique index would
    // additionally protect multiple processes, but existing duplicates need
    // an explicit data migration before that index can safely be introduced.
    const previous = this._pendingUpserts.get(userId) || Promise.resolve();
    const pending = previous.catch(() => {}).then(() => Coin.findOneAndUpdate(
      { userId }, update, { upsert: true, new: true }
    ));
    this._pendingUpserts.set(userId, pending);
    try {
      return await pending;
    } finally {
      if (this._pendingUpserts.get(userId) === pending) this._pendingUpserts.delete(userId);
    }
  }

  async removeCoins(userId, amount) {
    amount = normaliseAmount(amount);
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
    amount = normaliseAmount(amount);
    if (senderId === recipientId) throw new RangeError('Cannot transfer coins to yourself');
    await this.removeCoins(senderId, amount);
    try {
      await this.addCoins(recipientId, amount);
    } catch (err) {
      // Compensate a failed credit without requiring a replica set. This is
      // best effort: crash-safe multi-account transfers require transactions.
      try {
        await this.addCoins(senderId, amount);
      } catch (refundError) {
        throw new AggregateError([err, refundError], 'Transfer failed and the sender could not be refunded');
      }
      throw err;
    }
  }

  async getLeaderboard(limit = 10) {
    return Coin.find({ coins: { $gt: 0 } })
      .sort({ coins: -1 })
      .limit(limit)
      .select({ userId: 1, coins: 1 })
      .lean();
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

module.exports = {
  CoinService: new CoinService(),
  InsufficientFundsError,
  normaliseAmount
};
