const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { Collection } = require('discord.js');
const Privacy = require('../src/database/models/privacy');
const privacy = require('../src/database/services/privacyService');
const config = require('../src/config');

beforeEach(async (t) => {
  t.mock.method(Privacy, 'find', () => ({ lean: async () => [] }));
  t.mock.method(Privacy, 'findOneAndUpdate', async () => ({}));
  await privacy.load();
});

test('opt-out survives reload; failed changes do not silently enable tracking', async (t) => {
  await privacy.setOptOut('private-user', true);
  assert.equal(privacy.canTrack({ author: { id: 'private-user' } }), false);
  t.mock.method(Privacy, 'find', () => ({ lean: async () => [{ userId: 'private-user' }] }));
  await privacy.load();
  assert.equal(privacy.isOptedOut('private-user'), true);
  t.mock.method(Privacy, 'findOneAndUpdate', async () => { throw new Error('database unavailable'); });
  await assert.rejects(privacy.setOptOut('private-user', false), /database unavailable/);
  assert.equal(privacy.isOptedOut('private-user'), true);
  await assert.rejects(privacy.setOptOut('other-user', true));
  assert.equal(privacy.isOptedOut('other-user'), false);
});

test('capture paths skip opted-out messages before storing or reposting them', async () => {
  await privacy.setOptOut('private-user', true);
  const message = { author: { id: 'private-user' }, guild: { id: config.ids.guildId } };
  // No database, channel, cache, or filesystem is available in these fixtures.
  await require('../src/events/messageDelete').execute(message);
  await require('../src/events/messageUpdate').execute({}, message);
  await require('../src/events/messageCreate/lastping').execute(message);
  await require('../src/events/messageCreate/afk').execute(message, {});
  await require('../src/events/messageCreate/mafia').execute(message, {});
  await require('../src/events/messageCreate/autoreact').execute(message, {});
  await require('../src/events/mafiaRawLog').execute({
    t: 'MESSAGE_CREATE',
    d: { guild_id: config.ids.guildId, channel_id: 'mafia', author: message.author }
  });
});

test('raw reply and forwarded copies cannot bypass an author opt-out', async () => {
  await privacy.setOptOut('private-user', true);
  const result = privacy.filterPacket({
    d: {
      author: { id: 'public-user' }, content: 'public',
      referenced_message: { author: { id: 'private-user' }, content: 'secret reply' },
      message_snapshots: [{ message: { author: { id: 'private-user' }, content: 'secret forward' } }]
    }
  });
  assert.equal(result.d.content, 'public');
  assert.doesNotMatch(JSON.stringify(result), /secret|private-user/);
});

test('a failed preference load rejects instead of starting without stored opt-outs', async (t) => {
  await privacy.setOptOut('private-user', true);
  t.mock.method(Privacy, 'find', () => ({ lean: async () => { throw new Error('offline'); } }));
  await assert.rejects(privacy.load(), /offline/);
  assert.equal(privacy.isOptedOut('private-user'), true);
});

test('opt-in resumes capture and is not applied until its database write succeeds', async (t) => {
  await privacy.setOptOut('private-user', true);
  t.mock.method(Privacy, 'findOneAndUpdate', async () => {
    assert.equal(privacy.isOptedOut('private-user'), true);
  });
  await privacy.setOptOut('private-user', false);
  assert.equal(privacy.canTrack({ author: { id: 'private-user' } }), true);
});

test('skullboard cannot repost an opted-out author on either reaction event', async () => {
  await privacy.setOptOut('private-user', true);
  const reaction = {
    message: { id: 'private-message', guild: { id: config.ids.guildId }, author: { id: 'private-user' } },
    emoji: { name: '💀' }, fetch: async () => ({ count: 20 })
  };
  await require('../src/events/messageReactionAdd').execute(reaction, {});
  await require('../src/events/messageReactionRemove').execute(reaction, {});
});

test('highlight notifications omit opted-out context and opted-out recipients', async () => {
  await privacy.setOptOut('private-user', true);
  const sent = [];
  const author = { id: 'public-user', username: 'Public' };
  const message = {
    author, content: 'reviewdemo', createdTimestamp: Date.now(), url: 'https://discord.com/test',
    guild: { name: 'Test' },
    channel: {
      permissionsFor: () => ({ has: () => true }),
      messages: { fetch: async () => new Collection([
        ['private', { author: { id: 'private-user' }, content: 'secret context' }]
      ]) }
    }
  };
  const client = {
    state: { highlights: new Map([['reviewdemo', ['private-user', 'subscriber']]]) },
    users: { fetch: async (id) => {
      assert.equal(id, 'subscriber');
      return { send: async (payload) => sent.push(payload) };
    } }
  };
  await require('../src/events/messageCreate/highlight').execute(message, client);
  assert.equal(sent.length, 1);
  assert.match(sent[0].embeds[0].data.description, /reviewdemo/);
  assert.doesNotMatch(sent[0].embeds[0].data.description, /secret context/);
});

test('transcript export rechecks preferences for messages collected before opt-out', async (t) => {
  const fs = require('node:fs/promises');
  const os = require('node:os');
  const path = require('node:path');
  const transcripts = require('discord-html-transcripts-v2');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'carbon-privacy-'));
  const previousDirectory = process.env.transcriptPublicDir;
  process.env.transcriptPublicDir = directory;
  t.after(async () => {
    if (previousDirectory === undefined) delete process.env.transcriptPublicDir;
    else process.env.transcriptPublicDir = previousDirectory;
    await fs.rm(directory, { recursive: true, force: true });
  });
  t.mock.method(transcripts, 'generateFromMessages', async (messages) => {
    assert.deepEqual(messages.map((message) => message.content), ['public']);
    return Buffer.from('filtered transcript');
  });
  const messages = [
    { author: { id: 'private-user' }, content: 'secret' },
    { author: { id: 'public-user' }, content: 'public' }
  ];
  await privacy.setOptOut('private-user', true);
  const result = await require('../src/utils/transcripts').createHostedTranscript({ id: 'test' }, messages);
  assert.equal(await fs.readFile(result.filePath, 'utf8'), 'filtered transcript');
});

test('privacy command clears active caches and histories without elevated roles', async (t) => {
  const operations = [];
  for (const name of ['lastping', 'afk']) {
    const Model = require(`../src/database/models/${name}`);
    for (const method of ['updateMany', 'updateOne']) {
      t.mock.method(Model, method, async (...args) => operations.push({ name, method, args }));
    }
  }
  const entries = [{ msg: { author: { id: 'private-user' } } }, { msg: { author: { id: 'public-user' } } }];
  const edits = [{ author: { id: 'private-user' } }];
  const client = { state: {
    snipes: { snipes: new Collection([['channel', entries]]), esnipes: new Collection([['channel', edits]]) },
    counts: { activeUsers: new Set(['private-user']) }
  } };
  let reply;
  await require('../src/commands/utility/privacy').execute({
    author: { id: 'private-user', tag: 'Private' }, reply: async (content) => { reply = content; }
  }, ['optout'], client);
  assert.equal(privacy.isOptedOut('private-user'), true);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].msg.author.id, 'public-user');
  assert.equal(edits.length, 0);
  assert.equal(client.state.counts.activeUsers.size, 0);
  assert.equal(operations.length, 4);
  assert.match(reply, /not automatically deleted/);
});

test('command registry exposes privacy controls and omits the retired assistant aliases', () => {
  const client = { state: { commands: new Collection(), slashCommands: new Collection() } };
  require('../src/command/registry').loadCommands(client);
  assert.ok(client.state.commands.has('privacy'));
  for (const name of ['carbon', 'ai', 'assistant']) assert.equal(client.state.commands.has(name), false);
});
