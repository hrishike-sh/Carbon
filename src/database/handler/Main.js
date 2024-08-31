const mongoose = require('mongoose');
const MainDonationSchema = require('../main_dono');
const GrinderDonationSchema = require('../grinder_dono');
class Database {
  constructor(uri) {
    this.uri = uri;
  }

  async connect() {
    try {
      await mongoose.connect(this.uri);
    } catch (error) {
      throw new Error(error.msg);
    } finally {
      console.log('[DATABASE] Connected to the Mongo Database.');
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
    } catch (error) {
      throw new Error(error.msg);
    } finally {
      console.log('[DATABASE] Disconnected from the Mongo Database.');
    }
  }

  /**
   * @typedef {Object} getDonations
   * @param {Object} options
   * @param {string} userId
   * @returns {{ main?: number, grinder?: number, karuta?: number }}
   */
  async getDonations(userId, options) {
    if (!options) {
      throw new Error('Please provide appropriate options to get donations');
    } else {
      const result = [];
      if (options.main) {
        let data = await MainDonationSchema.findOne({
          userID: userId
        });
        if (!data) {
          data = new MainDonationSchema({ userID: userId, messages: 0 });
        }
        result.push({
          type: 'main',
          amount: data.messages
        });
      }

      if (options.grinder) {
        let data = await GrinderDonationSchema.findOne({
          userID: userId
        });
        if (!data) {
          data = new GrinderDonationSchema({
            userID: userId,
            amount: 0
          });
        }
        result.push({
          type: 'grinder',
          amount: data.amount
        });
      }

      if (options.karuta) {
        let data = await KarutaDonationSchema.findOne({
          userID: userId
        });
        if (!data) {
          data = new KarutaDonationSchema({
            userId,
            amount: 0
          });
        }
        result.push({
          type: 'karuta',
          amount: data.amount
        });
      }
    }
  }
}
