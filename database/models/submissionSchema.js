const mongoose = require('mongoose')

const SubSchema = new mongoose.Schema({
    userId: String,
    submittedAt: Number,
    votes: {
        upvotes: Number,
        downvotes: Number,
        netVotes: Number,
    },
    url: String,
    cooldown: Number,
    acceptedBy: String,
})

module.exports = mongoose.model('submission', SubSchema)
