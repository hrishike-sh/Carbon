const { model, Schema } = require('mongoose');

const TeamSchema = new Schema({
  roleId: { type: String, required: true },
  users: { type: [String], default: [] },
  logs: { type: [String], default: [] },
  points: { type: Number, default: 0 },
  name: { type: String, required: true }
});

module.exports = model('teams', TeamSchema);
