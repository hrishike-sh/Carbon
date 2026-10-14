const { Schema, model } = require('mongoose');

const TicketSchema = new Schema({
  userId: { type: String, index: true },
  amount: { type: Number, default: 0 }
});

TicketSchema.index({ amount: -1, _id: 1 });

module.exports = model('tickets', TicketSchema);
