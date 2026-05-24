const { Schema, model } = require('mongoose');

const RaffleSchema = new Schema({
  userId: { type: String },
  amount: { type: Number, default: 0 },
  created: { type: Date, default: new Date() }
});

module.exports = model('raffle', RaffleSchema, 'raffle');
