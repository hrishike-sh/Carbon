const { model, Schema } = require('mongoose');

const GiveawaySchema = new Schema({
  prize: { type: Number },
  endsAt: { type: Date },
  messageId: { type: String },
  channelId: { type: String }
});

module.exports = model('giveaways', GiveawaySchema, 'giveaways');
