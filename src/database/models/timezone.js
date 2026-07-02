const { Schema, model } = require('mongoose');

const TimezoneSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  timezone: { type: String, required: true },
  updatedAt: { type: Number, default: Date.now }
});

module.exports = model('timezones', TimezoneSchema);
