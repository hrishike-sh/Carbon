const { Schema, model } = require('mongoose');

const CoinSchema = new Schema({
  userId: { type: String, required: true, index: true },
  coins: { type: Number, default: 0 }
});

CoinSchema.index({ coins: -1 });

module.exports = model('coins', CoinSchema);
