const { Schema, model } = require('mongoose');

const PrivacySchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  messageTrackingOptOut: { type: Boolean, default: true }
});

module.exports = model('privacy', PrivacySchema);
