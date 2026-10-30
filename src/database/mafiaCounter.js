const { Schema, model } = require('mongoose');

const schema = new Schema({
  _id: String,
  value: { type: Number, required: true }
});

const MafiaCounter = model('mafiaCounter', schema);

module.exports = async function nextMafiaId() {
  // The fixed primary key and atomic increment also protect concurrent games.
  try {
    await MafiaCounter.updateOne(
      { _id: 'mafia' },
      { $setOnInsert: { value: 0 } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const counter = await MafiaCounter.findOneAndUpdate(
    { _id: 'mafia', value: { $lt: 99999 } },
    { $inc: { value: 1 } },
    { new: true }
  );
  if (!counter) throw new Error('All five-digit Mafia IDs have been used.');
  return String(counter.value).padStart(5, '0');
};

module.exports.model = MafiaCounter;
