
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: String,
    commandsRan: { type: Number, default: 0 },
    afk: {
        type: Object, default: {
            afk: false
        }
    },
    fighthub: {
        voting: {
            hasVoted: Boolean,
            lastVoted: Number,
            enabled: Boolean
        }
    }
})

module.exports = mongoose.model('user', UserSchema)