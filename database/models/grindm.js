  
const mongoose = require("mongoose");

const GrindersSchema = new mongoose.Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() }
});

module.exports = mongoose.model('grinderschema', GrindersSchema);