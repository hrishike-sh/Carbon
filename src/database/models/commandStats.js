const { Schema, model } = require('mongoose');

const CommandStatsSchema = new Schema({
  guildId: { type: String, required: true },
  commandName: { type: String, required: true },
  commandType: {
    type: String,
    enum: ['prefix', 'slash'],
    required: true
  },
  dateKey: { type: String, required: true },
  uses: { type: Number, default: 0 }
});

CommandStatsSchema.index(
  { guildId: 1, commandName: 1, commandType: 1, dateKey: 1 },
  { unique: true }
);
CommandStatsSchema.index({ guildId: 1, dateKey: 1 });

module.exports = model('commandStats', CommandStatsSchema);
