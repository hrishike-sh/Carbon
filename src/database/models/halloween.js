const { model, Schema } = require('mongoose');

const HalloweenSchema = new Schema({
  members: { type: [String] },
  points: { type: Number },
  name: { type: String },
  roleId: { type: String }
});

module.exports = model('halloween', HalloweenSchema);
