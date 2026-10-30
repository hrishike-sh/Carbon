const { Schema, model } = require('mongoose');

module.exports = model('mafiaTranscript', new Schema({
  _id: Number,
  url: { type: String, required: true, unique: true },
  recordedAt: { type: Date, required: true },
  messageId: String
}));
