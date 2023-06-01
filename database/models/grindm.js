const mongoose = require('mongoose');

const GrindersSchema = new mongoose.Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  time: { type: Number, default: new Date().getTime() }
});

module.exports = mongoose.model('grinderschema', GrindersSchema);
