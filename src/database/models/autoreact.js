const { Schema, model } = require('mongoose');

const AutoReactSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  keyword: { type: String, required: true },
  reaction: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now }
});

AutoReactSchema.index({ guildId: 1, keyword: 1, reaction: 1 }, { unique: true });

module.exports = model('autoreacts', AutoReactSchema);
