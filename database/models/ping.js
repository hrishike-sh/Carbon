const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: String,
  pings: { type: [Object], default: [] }
});

module.exports = mongoose.model('ping', MessageSchema);
