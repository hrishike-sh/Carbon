const mongoose = require('mongoose')

const PresentSchema = new mongoose.Schema({
    userId: String,
    presents: Number,
})

module.exports = mongoose.model('presents', PresentSchema)