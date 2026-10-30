const Transcript = require('../models/mafiaTranscript');
const nextMafiaId = require('../mafiaCounter');

const formatId = (value) => String(value).padStart(5, '0');

function normalizeEntry(entry) {
  const url = new URL(entry.url);
  // Transcripts on the previous domain were moved without changing filenames.
  if (url.hostname === 'hrish.dev' && url.pathname.startsWith('/transcripts/')) url.hostname = 'hrish.site';
  const recovered = url.pathname.match(/mafia-recovered-(\d{17,20})-/);
  const generated = url.pathname.match(/-(\d{13})\.html$/);
  const recordedAt = recovered
    ? new Date(Number((BigInt(recovered[1]) >> 22n) + 1420070400000n))
    : generated ? new Date(Number(generated[1])) : new Date(entry.recordedAt);
  if (!Number.isFinite(recordedAt.getTime())) throw new Error('Invalid historical transcript date.');
  return { ...entry, url: url.href, recordedAt };
}

async function nextId() {
  const state = await nextMafiaId.model.findById('mafia-history-v1').lean();
  if (!state) throw new Error('Run scripts/import-mafia-transcripts.js before starting new Mafia games.');
  return nextMafiaId();
}

async function record(id, url, recordedAt) {
  return Transcript.create({ _id: Number(id), url, recordedAt });
}

async function lookup(id, client) {
  const transcript = await Transcript.findById(Number(id)).lean();
  if (!transcript) return null;
  // Discord attachment URLs expire; fetching their message refreshes the URL.
  if (transcript.messageId && /https:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\//.test(transcript.url)) {
    const config = require('../../config');
    const channel = await client.channels.fetch(config.ids.channels.mafiaLog);
    const message = await channel.messages.fetch(transcript.messageId);
    const name = new URL(transcript.url).pathname.split('/').pop();
    const attachment = message.attachments.find((item) => item.name === name);
    if (!attachment) throw new Error('The original transcript attachment is no longer available.');
    transcript.url = attachment.url;
  }
  return transcript;
}

// One-time migration, run with the bot stopped. Retrying after a partial import is safe.
async function importHistory(entries) {
  await Transcript.init();
  const state = await nextMafiaId.model.findById('mafia-history-v1').lean();
  if (state) return { count: state.value, imported: false };
  const unique = [...new Map(entries.map(normalizeEntry).map((entry) => [
    new URL(entry.url).origin + new URL(entry.url).pathname, entry
  ])).values()].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt) || a.url.localeCompare(b.url));
  if (unique.length >= 99999) throw new Error('Five-digit Mafia ID capacity exceeded.');
  if (unique.length) {
    await Transcript.bulkWrite(unique.map((entry, index) => ({ updateOne: {
      filter: { _id: index + 1 },
      update: { $setOnInsert: { ...entry, _id: index + 1 } },
      upsert: true
    } })));
  }
  await nextMafiaId.model.updateOne({ _id: 'mafia' }, { $set: { value: unique.length } }, { upsert: true });
  await nextMafiaId.model.create({ _id: 'mafia-history-v1', value: unique.length });
  return { count: unique.length, imported: true };
}

module.exports = { nextId, record, lookup, importHistory, formatId, normalizeEntry };
