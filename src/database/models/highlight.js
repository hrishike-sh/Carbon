const { Schema, model } = require('mongoose');

const HighlightSchema = new Schema({
  userId: { type: String, index: true },
  highlights: [
    {
      type: String,
      default: []
    }
  ],
  enabled: {
    type: Boolean,
    default: true
  }
});

module.exports = model('highlight', HighlightSchema);
