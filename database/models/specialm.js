  
const mongoose = require("mongoose");

const specialThing = new mongoose.Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() }
});

module.exports = mongoose.model('special-dono', specialThing, 'special-dono');