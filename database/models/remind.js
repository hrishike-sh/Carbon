const mongoose = require('mongoose');

const RemindSchema = new mongoose.Schema({
  id: String,
  userId: String,
  time: Number,
  reason: String,
  link: String
});

module.exports = mongoose.model('reminder', RemindSchema);
