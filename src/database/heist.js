const { Schema, model } = require('mongoose');

const HeistSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() }
});

module.exports = model('heistdonos', HeistSchema);
