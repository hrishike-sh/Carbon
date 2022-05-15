const mongoose = require('mongoose')

const Fellowship = new mongoose.Schema({
    guildId: String,
    channelId: String,
    ownerIds: [String],
    owners: {
        one: {
            userId: String,
            invites: Number,
            invited: [],
        },
        two: {
            userId: String,
            invites: Number,
            invited: [],
        },
        three: {
            userId: String,
            invites: Number,
            invited: [],
        },
    },
})

module.exports = mongoose.model('fellowship', Fellowship)
