const { Schema, model } = require('mongoose');

const MainDonoSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  messages: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = model('messages', MainDonoSchema);
