const mongoose = require('mongoose')

const SpecialSchema = new mongoose.Schema({
    userId: String,
    amount: { type: Number, default: 0 },
    tickets: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: new Date().getTime() },
})

module.exports = mongoose.model('30k', SpecialSchema)
