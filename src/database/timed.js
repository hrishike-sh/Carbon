const { Schema, model } = require('mongoose');

const TimedSchema = new Schema({
  when: { type: Number },
  what: { type: String },
  data: { type: Object }
});

module.exports = model('timed', TimedSchema, 'timed');
