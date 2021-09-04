const mongoose = require('mongoose')

const adSchema = new mongoose.Schema({
  userId: String,
  ads: String
})

module.exports = mongoose.model('ads', adSchema)