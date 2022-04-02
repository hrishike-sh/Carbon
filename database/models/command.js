const mongoose = require('mongoose')

const CommandSchema = new mongoose.Schema({
    name: String,
    usage: { type: Number, default: 0 },
    disabled: false,
})

module.exports = mongoose.model('command', CommandSchema)
