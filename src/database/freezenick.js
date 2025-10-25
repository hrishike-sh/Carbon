const { Schema, model } = require('mongoose');

const CoinSchema = new Schema({
  userId: { type: String },
  name: { type: String }
});

module.exports = model('freezenick', CoinSchema);
