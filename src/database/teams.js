const { model, Schema } = require('mongoose');

const TeamSchema = new Schema({
  users: { type: [String], default: [] },
  points: { type: Number, default: 0 },
  name: { type: String, required: true }
});

module.exports = model('teams', TeamSchema);
