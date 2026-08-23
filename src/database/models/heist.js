const { Schema, model } = require('mongoose');

const HeistSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = model('heistdonos', HeistSchema);
