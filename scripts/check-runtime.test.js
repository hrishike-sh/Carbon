const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  Client, OverwriteType, PermissionFlagsBits, PermissionOverwriteManager
} = require('discord.js');
const TimedAction = require('../src/database/models/timed');
const timedActions = require('../src/events/timedActions');
const logger = require('../src/utils/logger');
const { editMessageSafely } = require('../src/utils/messages');

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
