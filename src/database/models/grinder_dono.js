const { Schema, model } = require('mongoose');

const GrinderDonoSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  time: { type: Number, default: new Date().getTime() },
  dynamic: {
    grinder: { type: Boolean, default: false },
    expires: { type: Number }
  }
});

module.exports = model('grinderschema', GrinderDonoSchema);
