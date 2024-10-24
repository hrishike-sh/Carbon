const { model, Schema } = require('mongoose');

const GiveawaySchema = new Schema({
  endsAt: { type: Date },
  messageId: { type: String }
});

module.exports = model('giveaways', GiveawaySchema, 'giveaways');
