
const mongoose = require('mongoose')
const reqString = {
    type: String,
    required: true
}
const CandyNomy = new mongoose.Schema({
    userId: reqString,
    candies: Number,
})

module.exports = mongoose.model('candies', CandyNomy)