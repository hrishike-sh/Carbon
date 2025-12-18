const { Schema, model } = require('mongoose');

const HighlightSchema = new Schema({
  userId: String,
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

module.export = model('highlight', HighlightSchema);
