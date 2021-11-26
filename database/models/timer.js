
const mongoose = require('mongoose')

const timerSchema = new mongoose.Schema({
    channelId: String,
    messageId: String,
    member: Object,
    time: Number,
    reminders: String,
    reason: String,
    ended: Boolean,
});

module.exports = mongoose.model('timer', timerSchema);