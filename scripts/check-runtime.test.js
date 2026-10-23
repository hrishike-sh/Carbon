const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  Client, OverwriteType, PermissionFlagsBits, PermissionOverwriteManager
} = require('discord.js');
const TimedAction = require('../src/database/models/timed');
const timedActions = require('../src/events/timedActions');
const logger = require('../src/utils/logger');
const { editMessageSafely } = require('../src/utils/messages');
const pingRole = require('../src/slash-commands/mods/ping-role');

test('mafia ping acknowledges the command, announces the event, and has its own cooldown', async (t) => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  function interaction(role) {
    const options = {
      role: { value: role },
      event: { value: true },
      'event-type': { value: 'mafia' },
      sponsor: { user: { toString: () => '<@123456789012345678>' } },
      prize: { value: '100 coins' }
    };
    const replies = [];
    const messages = [];
    return {
      replies, messages,
      member: { roles: { cache: { hasAny: () => true } } },
      options: { get: (name) => options[name] ?? null },
      async reply(payload) {
        await Promise.resolve();
        replies.push(payload);
      },
      channel: {
        id: '853280287777882142',
        async send(payload) {
          assert.equal(replies.length, 1, 'acknowledge before sending the announcement');
          messages.push(payload);
        }
      }
    };
  }

  const mafia = interaction('1154432845318721607');
  await pingRole.execute(mafia);
  assert.deepEqual(mafia.replies, [{ content: 'Pinged!', flags: 64 }]);
  assert.equal(mafia.messages.length, 1);
  assert.equal(mafia.messages[0].content, '<@&1154432845318721607>: New event!');
  const embed = mafia.messages[0].embeds[0].toJSON();
  assert.match(embed.description, /\*\*Event\*\*: mafia/);
  assert.match(embed.description, /<@123456789012345678>/);
  assert.match(embed.description, /100 coins/);
  assert.match(embed.description, /No requirement/);

  const duplicate = interaction('1154432845318721607');
  await pingRole.execute(duplicate);
  assert.equal(duplicate.messages.length, 0);
  assert.equal(duplicate.replies[0].flags, 64);
  assert.match(duplicate.replies[0].content, /on cooldown/);

  const event = interaction('858088201451995137');
  await pingRole.execute(event);
  assert.equal(event.messages.length, 1, 'mafia cooldown must not block the event role');
  assert.equal(event.messages[0].content, '<@&858088201451995137>: New event!');

  now += 30 * 60 * 1000;
  const expired = interaction('1154432845318721607');
  await pingRole.execute(expired);
  assert.equal(expired.messages.length, 1, 'mafia ping becomes available after 30 minutes');
});

function action() {
  return {
    id: 'expired-action',
    data: { channelId: '824294231447044197', userId: '824294231447044198' },
    deleted: false,
    async deleteOne() { this.deleted = true; }
  };
}

function stubPoll(t, actions) {
  t.mock.method(TimedAction, 'find', async (query) => {
    assert.equal(query.what, 'viewlock_timeout');
    assert.ok(query.when.$lte <= Date.now());
    return actions;
  });
  t.mock.method(global, 'setInterval', () => ({ unref() {} }));
  return t.mock.method(logger, 'error', () => {});
}

test('expired viewlock clears an uncached user restriction, preserving other permissions', async (t) => {
  const pending = action();
  const errors = stubPoll(t, [pending]);
  const client = new Client({ intents: [] });
  const channel = {
    id: pending.data.channelId,
    client,
    guild: { roles: { resolveId: (id) => id, resolve: () => null } }
  };
  channel.permissionOverwrites = new PermissionOverwriteManager(channel, [{
    id: pending.data.userId,
    type: OverwriteType.Member,
    allow: PermissionFlagsBits.ReadMessageHistory.toString(),
    deny: (PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages).toString()
  }]);
  assert.equal(client.users.cache.size, 0);
  const put = t.mock.method(client.rest, 'put', async (_, { body }) => {
    assert.equal(body.id, pending.data.userId);
    assert.equal(body.type, OverwriteType.Member);
    assert.equal(BigInt(body.allow), PermissionFlagsBits.ReadMessageHistory);
    assert.equal(BigInt(body.deny), PermissionFlagsBits.SendMessages);
    assert.equal(pending.deleted, false);
  });
  t.mock.method(client.channels, 'fetch', async () => channel);
  await timedActions.execute(client);
  assert.equal(put.mock.callCount(), 1);
  assert.equal(pending.deleted, true);
  assert.equal(errors.mock.callCount(), 0);
});

test('channel fetch failures retain pending actions, but deleted channels are retired', async (t) => {
  const unavailable = action();
  const deleted = action();
  deleted.data.channelId = '824294231447044199';
  const errors = stubPoll(t, [unavailable, deleted]);
  await timedActions.execute({ channels: { async fetch(id) {
    throw Object.assign(new Error('Fetch failed'), {
      code: id === deleted.data.channelId ? 10003 : 50001
    });
  } } });
  assert.equal(unavailable.deleted, false);
  assert.equal(deleted.deleted, true);
  assert.equal(errors.mock.callCount(), 1);
});

test('failed permission updates are retried without losing the action', async (t) => {
  const pending = action();
  const errors = stubPoll(t, [pending]);
  await timedActions.execute({ channels: { async fetch() {
    return { permissionOverwrites: {
      cache: new Map([[pending.data.userId, {}]]),
      async edit() { throw new Error('Network failure'); }
    } };
  } } });
  assert.equal(pending.deleted, false);
  assert.equal(errors.mock.callCount(), 1);
});

test('missing overwrites and deletion races retire stale actions', async (t) => {
  const missing = action();
  const raced = action();
  raced.data.channelId = '824294231447044199';
  const errors = stubPoll(t, [missing, raced]);
  let edits = 0;
  await timedActions.execute({ channels: { async fetch(id, options) {
    assert.equal(options.force, true);
    return { permissionOverwrites: {
      cache: new Map(id === raced.data.channelId ? [[raced.data.userId, {}]] : []),
      async edit() {
        edits++;
        throw Object.assign(new Error('Unknown Overwrite'), { code: 10009 });
      }
    } };
  } } });
  assert.equal(edits, 1);
  assert.equal(missing.deleted, true);
  assert.equal(raced.deleted, true);
  assert.equal(errors.mock.callCount(), 0);
});

test('message cleanup handles deletion races and reports other edit failures', async (t) => {
  const errors = t.mock.method(logger, 'error', () => {});
  const message = { id: 'message', async edit() {
    throw Object.assign(new Error('Unknown Message'), { code: 10008 });
  } };
  assert.equal(await editMessageSafely(message, { components: [] }), null);
  assert.equal(errors.mock.callCount(), 0);
  message.edit = async () => { throw new Error('Network failure'); };
  assert.equal(await editMessageSafely(message, { components: [] }), null);
  assert.equal(errors.mock.callCount(), 1);
  message.edit = async (options) => options;
  assert.deepEqual(await editMessageSafely(message, { components: [] }), { components: [] });
});
