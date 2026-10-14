const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const logger = require('../src/utils/logger');
const highlight = require('../src/events/messageCreate/highlight');
const timedActions = require('../src/events/timedActions');
const TimedAction = require('../src/database/models/timed');
const AFK = require('../src/database/models/afk');
const afk = require('../src/events/messageCreate/afk');
const messageUpdate = require('../src/events/messageUpdate');
const skullboard = require('../src/utils/skullboard');
const Skullboard = require('../src/database/models/skullboard');

const flush = () => new Promise((resolve) => setImmediate(resolve));

function highlightFixture() {
  const sent = [];
  let contextsFetched = 0;
  const client = {
    state: { highlights: new Map([['hello', ['recipient']]]), lastHighlightPing: new Map() },
    users: { fetch: async () => ({ send: async (payload) => sent.push(payload) }) }
  };
  const message = {
    id: 'message',
    guild: { name: 'Guild' },
    content: 'Hello there!',
    author: { id: 'author', username: 'Author' },
    url: 'https://discord.com/channels/1/2/3',
    createdTimestamp: Date.now(),
    attachments: new Map(),
    channel: {
      permissionsFor: () => ({ has: () => true }),
      messages: { fetch: async () => { contextsFetched++; return new Map(); } },
      toString: () => '#general'
    }
  };
  return { client, message, sent, contextsFetched: () => contextsFetched };
}

test('simultaneous highlights send once and skip context requests during cooldown', async () => {
  const fixture = highlightFixture();
  await Promise.all([
    highlight.execute(fixture.message, fixture.client),
    highlight.execute(fixture.message, fixture.client)
  ]);
  await highlight.execute(fixture.message, fixture.client);
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.contextsFetched(), 1);
});

test('highlight permission checks and word boundaries prevent unintended notifications', async () => {
  const fixture = highlightFixture();
  fixture.message.content = 'helloworld';
  await highlight.execute(fixture.message, fixture.client);
  fixture.message.content = 'hello';
  fixture.message.channel.permissionsFor = () => null;
  await highlight.execute(fixture.message, fixture.client);
  assert.equal(fixture.sent.length, 0);
  assert.equal(fixture.contextsFetched(), 0);
});

test('a context-fetch failure still sends the matching message and releases the reservation', async () => {
  const fixture = highlightFixture();
  fixture.message.channel.messages.fetch = async () => { throw new Error('Missing history'); };
  await highlight.execute(fixture.message, fixture.client);
  fixture.client.state.lastHighlightPing.clear();
  await highlight.execute(fixture.message, fixture.client);
  assert.equal(fixture.sent.length, 2);
  assert.match(fixture.sent[0].embeds[0].data.description, /Hello/);
});

test('timed actions survive transient channel failures and poll again after an initial DB failure', async (t) => {
  t.mock.method(logger, 'error', () => {});
  let tick;
  const timer = { unref: () => {} };
  t.mock.method(global, 'setInterval', (callback) => { tick = callback; return timer; });
  let deletions = 0;
  const action = {
    id: 'action', data: { channelId: 'channel', userId: 'user' },
    deleteOne: async () => { deletions++; }
  };
  let attempts = 0;
  t.mock.method(TimedAction, 'find', async () => {
    attempts++;
    if (attempts === 1) throw new Error('Database unavailable');
    return [action];
  });
  const client = {
    state: {},
    channels: { fetch: async () => { throw new Error('Network failure'); } }
  };
  await timedActions.execute(client);
  assert.equal(typeof tick, 'function');
  await tick();
  assert.equal(deletions, 0);
  const reasons = [];
  client.channels.fetch = async () => ({
    permissionOverwrites: { edit: async (...args) => reasons.push(args) }
  });
  await tick();
  assert.equal(deletions, 1);
  assert.deepEqual(reasons[0][2], { type: 1, reason: 'Temporary viewlock expired' });
});

test('expired viewlocks for deleted channels are removed', async (t) => {
  t.mock.method(global, 'setInterval', () => ({ unref: () => {} }));
  let deletions = 0;
  t.mock.method(TimedAction, 'find', async () => [{
    data: { channelId: 'deleted', userId: 'user' },
    deleteOne: async () => { deletions++; }
  }]);
  await timedActions.execute({ state: {}, channels: { fetch: async () => {
    throw Object.assign(new Error('Unknown channel'), { code: 10003 });
  } } });
  assert.equal(deletions, 1);
});

test('concurrent AFK returns claim ping history once and paginate long histories', async (t) => {
  let record = { dms: Array.from({ length: 30 }, () => ({
    time: Date.now(), tag: 'Author', content: 'x'.repeat(2000), link: 'https://discord.com/channels/1/2/3'
  })) };
  t.mock.method(AFK, 'findOneAndDelete', async () => {
    const claimed = record;
    record = null;
    return claimed;
  });
  const dms = [];
  let replies = 0;
  const client = { state: { afks: ['user'], afkIgnore: [] } };
  const message = {
    channel: { id: 'channel' },
    author: { id: 'user', tag: 'User', createDM: async () => ({ send: async (payload) => dms.push(payload) }) },
    mentions: { members: new Map() },
    reply: async () => { replies++; throw new Error('Cannot send here'); }
  };
  await Promise.all([afk.execute(message, client), afk.execute(message, client)]);
  assert.equal(replies, 1);
  assert.ok(dms.length > 1);
  for (const payload of dms) assert.ok(payload.embeds[0].data.description.length <= 4096);
  assert.deepEqual(client.state.afks, []);
});

test('embed-only message updates are not recorded as edits', async () => {
  const esnipes = new Map();
  const message = {
    content: 'unchanged', guild: {}, author: { bot: false }, channel: { id: 'channel' },
    createdTimestamp: 1000, editedTimestamp: 3000,
    client: { state: { snipes: { esnipes } } }
  };
  await messageUpdate.execute(message, { ...message });
  assert.equal(esnipes.size, 0);
  await messageUpdate.execute(message, { ...message, content: 'edited' });
  assert.equal(esnipes.get('channel')[0].editedIn, 2000);
});

test('skullboard serializes add/remove bursts and removes a post that drops below threshold', async (t) => {
  let stored = null;
  let releaseSend;
  const sendGate = new Promise((resolve) => { releaseSend = resolve; });
  let sends = 0;
  let deletes = 0;
  const posted = { id: 'board-message', delete: async () => { deletes++; } };
  t.mock.method(Skullboard, 'findOne', async () => stored);
  t.mock.method(Skullboard.prototype, 'save', async function () { stored = this; return this; });
  t.mock.method(Skullboard.prototype, 'deleteOne', async () => { stored = null; });
  const channel = {
    id: 'source', isTextBased: () => true,
    send: async () => { sends++; await sendGate; return posted; },
    messages: { fetch: async () => posted }
  };
  const message = {
    id: 'original', channel, guild: { id: config.ids.guildId, channels: { cache: new Map([[config.ids.channels.skullboard, channel]]) } },
    author: { id: 'author', tag: 'Author', displayAvatarURL: () => 'https://example.com/avatar.png' },
    content: 'skull', url: 'https://discord.com/channels/1/2/3'
  };
  const reaction = (count) => ({ count, message, emoji: { name: '💀' }, fetch: async () => ({ count, message }) });
  const add = skullboard.syncSkullboard(reaction(10), true);
  await flush();
  assert.equal(sends, 1);
  const remove = skullboard.syncSkullboard(reaction(9));
  releaseSend();
  await Promise.all([add, remove]);
  assert.equal(sends, 1);
  assert.equal(deletes, 1);
  assert.equal(stored, null);
});

test('ordinary skull reactions below threshold do not query the database', async (t) => {
  const find = t.mock.method(Skullboard, 'findOne', async () => { throw new Error('Unexpected query'); });
  await skullboard.syncSkullboard({
    count: 2, partial: false, emoji: { name: '💀' }, message: { id: 'low-count', guild: { id: config.ids.guildId } }
  }, true);
  assert.equal(find.mock.callCount(), 0);
});
