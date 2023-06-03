const { Schema, model } = require('mongoose');

const AFKSchema = new Schema({
  userId: { type: String },
  reason: { type: String },
  time: { type: Number },
  dms: { type: [Object] }
});

module.exports = model('afks', AFKSchema);
