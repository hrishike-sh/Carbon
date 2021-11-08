const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  guildID: { type: String, required: true },
  donationRoles: { type: [String] },
  logChannel: { type: String },
  gtnRole: { type: [String] },
  disabledDrop: { type: [String] },
  snipes: { type: Boolean },
  lockdownSet: {
    channels: [String],
    lockDowned: Boolean,
    issuedBy: String,
    message: String
  }
});

module.exports = mongoose.model('SettingsSchema', SettingsSchema);