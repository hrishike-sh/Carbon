const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: String,
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
});

module.exports = mongoose.model('message-lb', MessageSchema)