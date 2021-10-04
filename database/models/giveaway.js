
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
    entries: [String],
    endsAt: {
        type: Date,
        required: true,
    },
    hasEnded: Boolean
});

module.exports = mongoose.model('giveaways', GiveawaySchema)