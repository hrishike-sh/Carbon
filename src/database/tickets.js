const { Schema, model } = require('mongoose');

const TicketSchema = new Schema({
  userId: { type: String },
  amount: { type: Number, default: 0 }
});

module.exports = model('tickets', TicketSchema);
