const mongoose = require('mongoose')

const SpecialSchema = new mongoose.Schema({
    userId: String,
    amount: Number,
    lastUpdated: { type: Date, default: new Date().getTime() },
})

module.exports = mongoose.model('30k', SpecialSchema)
