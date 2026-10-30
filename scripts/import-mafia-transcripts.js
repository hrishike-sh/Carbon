// Run once before starting the updated bot. No historical Discord messages are changed.
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const { REST, Routes } = require('discord.js');
const config = require('../src/config');
const transcripts = require('../src/database/services/mafiaTranscriptService');

function extractEntries(message) {
  const urls = [...(message.content || '').matchAll(/https?:\/\/[^\s<>]+/g)].map((match) => match[0]);
  for (const attachment of message.attachments || []) urls.push(attachment.url);
  return urls.filter((url) => {
    try { return new URL(url).pathname.toLowerCase().endsWith('.html'); } catch { return false; }
  }).map((url) => ({ url, recordedAt: message.timestamp, messageId: message.id }));
}

async function collectHistory(rest) {
  const entries = [];
  let before;
  let pages = 0;
  while (true) {
    const query = new URLSearchParams({ limit: '100' });
    if (before) query.set('before', before);
    const messages = await rest.get(Routes.channelMessages(config.ids.channels.mafiaLog), { query });
    if (!messages.length) break;
    for (const message of messages) entries.push(...extractEntries(message));
    before = messages.at(-1).id;
    if (++pages % 25 === 0) console.log(`Scanned ${pages * 100} log messages; found ${entries.length} transcript links.`);
  }
  return entries;
}

async function main() {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
  if (!process.env.mongopath) throw new Error('Missing mongopath.');
  const args = process.argv.slice(2);
  if (args.length && (args[0] !== '--inventory' || args.length !== 2)) {
    throw new Error('Usage: node scripts/import-mafia-transcripts.js [--inventory file.json]');
  }
  const entries = args.length
    ? JSON.parse(await fs.readFile(args[1], 'utf8')).map((entry) => ({
      url: entry.url, recordedAt: entry.recordedAt || entry.createdAt, messageId: entry.messageId
    }))
    : await collectHistory(new REST({ version: '10' }).setToken(process.env.token));
  try {
    await mongoose.connect(process.env.mongopath, { serverSelectionTimeoutMS: 15000 });
    const result = await transcripts.importHistory(entries);
    console.log(`${result.imported ? 'Imported' : 'Already imported'} ${result.count} transcripts, oldest to newest. Next Mafia ID: ${transcripts.formatId(result.count + 1)}.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { extractEntries, collectHistory };
