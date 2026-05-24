const { Schema, model } = require('mongoose');

const PresentSchema = new Schema({
  userId: { type: String },
  amount: { type: Number, default: 0 }
});

module.exports = model('presents24', PresentSchema);
