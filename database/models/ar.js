const mongoose = require('mongoose')

const ARSchema = new mongoose.Schema({
    trigger: String,
    response: String,
    uses: Number,
    addedBy: String,
})

module.exports = mongoose.model('autoresponse', ARSchema)
