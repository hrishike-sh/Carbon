const { Schema, model } = require('mongoose');

const overwriteSchema = new Schema({
  id: String,
  type: Number,
  allow: String,
  deny: String
}, { _id: false });

const tournamentLockSchema = new Schema({
  _id: String,
  overwrites: [overwriteSchema]
});

module.exports = model('TournamentLock', tournamentLockSchema);
