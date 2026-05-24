const MainDono = require('../models/main_dono');
const GrinderDono = require('../models/grinder_dono');

class DonationService {
  async getDonations(userId, { main, grinder } = {}) {
    if (!main && !grinder) {
      throw new Error('Please provide options (main, grinder) to get donations');
    }

    const result = [];

    if (main) {
      let doc = await MainDono.findOne({ userID: userId });
      if (!doc) {
        doc = new MainDono({ userID: userId, messages: 0 });
        await doc.save();
      }
      result.push({ type: 'main', amount: doc.messages });
    }

    if (grinder) {
      let doc = await GrinderDono.findOne({ userID: userId });
      if (!doc) {
        doc = new GrinderDono({ userID: userId, amount: 0 });
        await doc.save();
      }
      result.push({ type: 'grinder', amount: doc.amount });
    }

    return result;
  }

  async addDonation(userId, type, amount) {
    const Model = type === 'main' ? MainDono : GrinderDono;

    await Model.findOneAndUpdate(
      { userID: userId },
      { $inc: type === 'main' ? { messages: amount } : { amount } },
      { upsert: true, new: true }
    );
  }
}

module.exports = new DonationService();
