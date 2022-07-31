const mongoose = require('mongoose')

const TokenModel = new mongoose.Schema({
    userId: String,
    tokens: { type: Number, default: 0 },
})

module.exports = mongoose.model('token', TokenModel)
