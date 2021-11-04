
const mongoose = require('mongoose')
const reqString = {
    type: String,
    required: true
}
const GiveawaySchema = new mongoose.Schema({
    guildId: reqString,
    channelId: reqString,
    messageId: reqString,
    hosterId: reqString,
    winners: Number,
    entries: [String],
    prize: reqString,
    endsAt: Number,
    hasEnded: Boolean,
    requirements: [String],
});

module.exports = mongoose.model('giveaway', GiveawaySchema, 'giveaway')