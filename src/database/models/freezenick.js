const { Schema, model } = require('mongoose');

const CoinSchema = new Schema({
  userId: { type: String, index: true },
  name: { type: String }
});

module.exports = model('freezenick', CoinSchema);
