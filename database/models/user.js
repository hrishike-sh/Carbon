const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    userId: String,
    commandsRan: { type: Number, default: 0 },
    afk: {
        type: Object,
        default: {
            afk: false,
        },
    },
    highlight: {
        type: Object,
        default: {
            words: [String],
        },
    },
    fighthub: {
        voting: {
            hasVoted: Boolean,
            lastVoted: Number,
            enabled: Boolean,
        },
        investor: {
            isInvestor: Boolean,
            expiresOn: Number,
        },
    },
})

module.exports = mongoose.model('user', UserSchema)
