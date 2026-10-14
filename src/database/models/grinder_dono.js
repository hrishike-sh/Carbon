const { Schema, model } = require('mongoose');

const GrinderDonoSchema = new Schema({
  userID: { type: String },
  guildID: { type: String },
  amount: { type: Number, default: 0 },
  time: { type: Number, default: Date.now },
  dynamic: {
    grinder: { type: Boolean, default: false },
    expires: { type: Number }
  }
});

GrinderDonoSchema.index({ userID: 1, guildID: 1 });
GrinderDonoSchema.index({ guildID: 1, amount: -1, _id: 1 });
GrinderDonoSchema.index({ guildID: 1, 'dynamic.grinder': 1, 'dynamic.expires': 1 });

module.exports = model('grinderschema', GrinderDonoSchema);
