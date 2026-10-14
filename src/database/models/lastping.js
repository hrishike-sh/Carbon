const { Schema, model } = require('mongoose');

const LastPingSchema = new Schema({
  userId: { type: String, index: true },
  pings: { type: [Object] }
});

module.exports = model('lastping', LastPingSchema);
