const { Schema, model } = require('discord.js');

const ThirtySchema = new Schema({
  userId: { type: String },
  amount: { type: Number },
  tickets: { type: Number },
  lastUpdated: { type: Date, defualt: new Date() }
});

module.exports = model('30ks', ThirtySchema);
