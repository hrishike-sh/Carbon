const { test } = require('node:test');
const assert = require('node:assert/strict');
const Transcript = require('../src/database/models/mafiaTranscript');
const service = require('../src/database/services/mafiaTranscriptService');
const counter = require('../src/database/mafiaCounter');
const command = require('../src/commands/utility/mafiatranscript');
const config = require('../src/config');
const { extractEntries } = require('../scripts/import-mafia-transcripts');

test('history migration deduplicates links and numbers oldest first; retries do not reset counter', async (t) => {
  t.mock.method(Transcript, 'init', async () => {});
  t.mock.method(counter.model, 'findById', () => ({ lean: async () => null }));
  const writes = [];
  t.mock.method(Transcript, 'bulkWrite', async (operations) => writes.push(...operations));
  const counters = [];
  t.mock.method(counter.model, 'updateOne', async (...args) => counters.push(args));
  t.mock.method(counter.model, 'create', async () => {});
  const old = { url: 'https://example.com/old.html', recordedAt: '2026-01-01' };
  const recent = { url: 'https://example.com/new.html', recordedAt: '2026-02-01' };
  assert.deepEqual(await service.importHistory([recent, old, old]), { count: 2, imported: true });
  assert.equal(writes[0].updateOne.update.$setOnInsert.url, old.url);
  assert.equal(writes[1].updateOne.update.$setOnInsert._id, 2);
  assert.equal(counters[0][1].$set.value, 2);
  t.mock.method(counter.model, 'findById', () => ({ lean: async () => ({ value: 2 }) }));
  assert.deepEqual(await service.importHistory([old]), { count: 2, imported: false });
  assert.equal(counters.length, 1);
});

test('next ID requires completed migration, pads numbers, and refuses overflow', async (t) => {
  t.mock.method(counter.model, 'findById', () => ({ lean: async () => null }));
  await assert.rejects(service.nextId(), /import-mafia/);
  t.mock.method(counter.model, 'findById', () => ({ lean: async () => ({ value: 2 }) }));
  t.mock.method(counter.model, 'updateOne', async () => {});
  t.mock.method(counter.model, 'findOneAndUpdate', async () => ({ value: 3 }));
  assert.equal(await service.nextId(), '00003');
  t.mock.method(counter.model, 'findOneAndUpdate', async () => null);
  await assert.rejects(service.nextId(), /five-digit/);
});

test('lookup refuses other categories and invalid IDs before querying; warns with the link', async (t) => {
  const replies = [];
  const message = { guild: { id: config.ids.guildId }, channel: { parentId: 'wrong' }, reply: async (value) => replies.push(value) };
  let queries = 0;
  t.mock.method(service, 'lookup', async () => { queries++; return { _id: 3, url: 'https://example.com/mafia.html' }; });
  await command.execute(message, ['3'], {});
  assert.equal(queries, 0);
  message.channel.parentId = config.ids.mafiaTranscriptCategory;
  for (const args of [[], ['0'], ['-1'], ['100000'], ['1', '2'], ['1.5']]) await command.execute(message, args, {});
  assert.equal(queries, 0);
  await command.execute(message, ['00003'], {});
  assert.equal(queries, 1);
  assert.match(replies.at(-1).content, /00003.*https:\/\/example.com\/mafia.html/);
  assert.match(replies.at(-1).content, /Do not share.*ANYWHERE/);
  t.mock.method(service, 'lookup', async () => null);
  await command.execute(message, ['4'], {});
  assert.match(replies.at(-1), /No Mafia transcript/);
});

test('history collector accepts hosted transcripts and HTML attachments without treating other links as transcripts', () => {
  const entries = extractEntries({ id: '123', timestamp: '2026-01-01', content: 'Transcript: https://example.com/mafia.html https://example.com', attachments: [{ url: 'https://cdn.discordapp.com/a/transcript.html?ex=123' }] });
  assert.equal(entries.length, 2);
  assert.equal(entries[1].messageId, '123');
});

test('recovered games sort by original game time and old domain links use the current host', () => {
  const entry = service.normalizeEntry({ url: 'https://hrish.dev/transcripts/mafia-recovered-1550728800835473469-1550730670551207947.html', recordedAt: '2026-10-01' });
  assert.equal(entry.recordedAt.toISOString(), '2026-09-19T04:42:37.267Z');
  assert.match(entry.url, /^https:\/\/hrish.site\//);
});

test('completed games persist their transcript and announce the same ID in both channels', async (t) => {
  const { Collection, ChannelType } = require('discord.js');
  const hosted = require('../src/utils/transcripts');
  t.mock.method(service, 'nextId', async () => '00263');
  let saved;
  t.mock.method(service, 'record', async (...args) => { saved = args; });
  t.mock.method(hosted, 'createHostedTranscript', async (channel, messages, options) => {
    assert.equal(options.prefix, 'mafia-00263');
    assert.equal(messages.length, 2);
    return { url: 'https://example.com/mafia-00263.html' };
  });
  delete require.cache[require.resolve('../src/events/messageCreate/mafia')];
  const mafia = require('../src/events/messageCreate/mafia');
  const logs = [];
  const notices = [];
  const log = { isTextBased: () => true, send: async (payload) => logs.push(payload) };
  const notice = { isTextBased: () => true, send: async (payload) => {
    assert.ok(saved, 'transcript must be saved before announcing it');
    notices.push(payload);
  } };
  const client = { channels: { cache: new Collection([
    [config.ids.channels.mafiaLog, log], [config.ids.channels.mafiaTranscriptNotice, notice]
  ]) } };
  const channel = { id: 'test-mafia', name: 'mafia', type: ChannelType.GuildText, send: async () => {} };
  const users = new Collection(Array.from({ length: 5 }, (_, index) => [String(index), {}]));
  const opening = { channel, client, guild: { id: config.ids.guildId }, author: { id: config.ids.mafiaBotIds[0] }, mentions: { users }, content: 'Players', embeds: [], createdTimestamp: 1793343462000 };
  await mafia.execute(opening, client);
  await mafia.execute({ ...opening, content: 'Game Over', mentions: { users: new Collection() } }, client);
  assert.deepEqual(saved, ['00263', 'https://example.com/mafia-00263.html', opening.createdTimestamp]);
  assert.ok(logs.some((entry) => typeof entry === 'string' && entry.includes('00263') && entry.includes('https://example.com/')));
  assert.match(notices[0], /mafia <t:1793343462:F> with id "00263" thanks/);
});
