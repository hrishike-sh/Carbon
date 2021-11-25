
const mongoose = require('mongoose')

const timerSchema = new mongoose.Schema({
    time: Number,
    reminders: String
});

module.exports = mongoose.model('timer', timerSchema);