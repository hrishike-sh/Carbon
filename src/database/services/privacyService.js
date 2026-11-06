const Privacy = require('../models/privacy');

// Loaded before gateway listeners are registered. A failed load prevents startup.
const optedOut = new Set();

async function load() {
  const records = await Privacy.find({ messageTrackingOptOut: true }).lean();
  optedOut.clear();
  for (const record of records) optedOut.add(record.userId);
}

function isOptedOut(userId) {
  return optedOut.has(userId);
}

function canTrack(message) {
  return Boolean(message?.author?.id) && !isOptedOut(message.author.id);
}

async function setOptOut(userId, value) {
  // Block new capture while the preference is being persisted.
  const previous = isOptedOut(userId);
  if (value) optedOut.add(userId);
  try {
    await Privacy.findOneAndUpdate(
      { userId },
      { $set: { messageTrackingOptOut: value } },
      { upsert: true }
    );
    if (!value) optedOut.delete(userId);
  } catch (err) {
    if (!previous) optedOut.delete(userId);
    throw err;
  }
}

// Raw gateway packets can contain copies of other authors' messages in replies
// and forwarded message snapshots. Remove those before writing the packet.
function filterPacket(value) {
  if (!value || typeof value !== 'object') return value;
  if (isOptedOut(value.author?.id)) return null;
  if (Array.isArray(value)) return value.map(filterPacket).filter((item) => item !== null);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, filterPacket(item)]));
}

module.exports = { load, isOptedOut, canTrack, setOptOut, filterPacket };
