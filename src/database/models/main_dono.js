const { Schema, model } = require('mongoose');

const MainDonoSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  messages: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

MainDonoSchema.index({ userID: 1, guildID: 1 });
MainDonoSchema.index({ guildID: 1, messages: -1, _id: 1 });

module.exports = model('messages', MainDonoSchema);
