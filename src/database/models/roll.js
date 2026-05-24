const { Schema, model } = require('mongoose');

const RollSchema = new Schema({
  userId: { type: String },
  amount: { type: Number, default: 0 }
});

module.exports = model('rolls', RollSchema);
