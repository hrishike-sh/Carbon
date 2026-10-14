const { Schema, model } = require('mongoose');

const TimedSchema = new Schema({
  when: { type: Number },
  what: { type: String },
  data: { type: Object }
});

TimedSchema.index({ what: 1, when: 1 });

module.exports = model('timed', TimedSchema, 'timed');
