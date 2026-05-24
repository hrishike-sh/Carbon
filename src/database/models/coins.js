const { Schema, model } = require('mongoose');

const CoinSchema = new Schema({
  userId: { type: String },
  coins: { type: Number, default: 0 }
});

module.exports = model('coins', CoinSchema);
