const MainDono = require('../models/main_dono');
const GrinderDono = require('../models/grinder_dono');

class DonationService {
  async getDonations(userId, { main, grinder } = {}) {
    if (!main && !grinder) {
      throw new Error('Please provide options (main, grinder) to get donations');
    }

    const requests = [];

    if (main) {
      requests.push(MainDono.findOne({ userID: userId }).select({ messages: 1 }).lean()
        .then((doc) => ({ type: 'main', amount: doc?.messages ?? 0 })));
    }

    if (grinder) {
      requests.push(GrinderDono.findOne({ userID: userId }).select({ amount: 1 }).lean()
        .then((doc) => ({ type: 'grinder', amount: doc?.amount ?? 0 })));
    }

    return Promise.all(requests);
  }

  async addDonation(userId, type, amount) {
    if (!['main', 'grinder'].includes(type)) throw new RangeError('Unknown donation type');
    if (!Number.isSafeInteger(amount) || amount === 0) throw new RangeError('Donation amount must be a non-zero safe integer');
    const Model = type === 'main' ? MainDono : GrinderDono;

    await Model.findOneAndUpdate(
      { userID: userId },
      { $inc: type === 'main' ? { messages: amount } : { amount } },
      { upsert: true, new: true }
    );
  }
}

module.exports = new DonationService();
