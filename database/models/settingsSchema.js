const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  guildID: { type: String, required: true },
  donationRoles: { type: [String] },
  logChannel: { type: String },
  gtnRole: { type: [String] }
});

module.exports = mongoose.model('SettingsSchema', SettingsSchema);