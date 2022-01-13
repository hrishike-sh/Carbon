const mongoose = require('mongoose')

const SubSchema = new mongoose.Schema({
    userId: String,
    submittedAt: Number,
    votes: {
        upvotes: Number,
        downvotes: Number,
        netVotes: Number,
    },
    acceptedBy: String,
})
