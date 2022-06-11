const mongoose = require('mongoose')

const CurrencyModel = new mongoose.Schema({
    userId: String,
    Balance: Number,
    Inventoru: [Object],
})

module.exports = mongoose.model('currency', CurrencyModel, 'currency')
