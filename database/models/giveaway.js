const mongoose = require('mongoose');
const reqString = {
  type: String,
  required: true
};
const GiveawaySchema = new mongoose.Schema({
  guildId: reqString,
  channelId: reqString,
  messageId: reqString,
  hosterId: reqString,
  sponsor: {
    id: String,
    thanks: Number
  },
  winners: Number,
  prize: reqString,
  endsAt: Number,
  hasEnded: Boolean,
  requirements: [String],
  entries: [],
  WWinners: [],
  lastEntryCount: Number
});

module.exports = mongoose.model('giveaway', GiveawaySchema, 'giveaway');
