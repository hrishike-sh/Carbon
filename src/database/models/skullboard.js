const { Schema, model } = require('mongoose');

const SkullSchema = new Schema({
  skullboardMessage: {
    id: { type: String }
  },
  originalMessage: {
    channelId: { type: String },
    id: { type: String }
  },
  user: {
    id: { type: String }
  }
});

SkullSchema.index({ 'originalMessage.id': 1 });

module.exports = model('skullboard', SkullSchema, 'skullboard');
