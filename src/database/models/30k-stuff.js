const { Schema, model } = require('mongoose');

const ThirtySchema = new Schema({
  userId: { type: String },
  amount: { type: Number },
  tickets: { type: Number },
  lastUpdated: { type: Date, default: new Date() }
});

module.exports = model('30ks', ThirtySchema);
