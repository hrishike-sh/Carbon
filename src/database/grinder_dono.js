const { Schema, model } = require('mongoose');

const GrinderDonoSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  time: { type: Number, default: new Date().getTime() }
});

module.exports = model('grinderschema', GrinderDonoSchema);
