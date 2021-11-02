
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: String,
    commandsRan: { type: Number, default: 0 },
    afk: Object,
})

module.exports = mongoose.model('user', UserSchema)