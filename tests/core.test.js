const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { Collection } = require('discord.js');
const { loadPrefixCommands, loadSlashCommands } = require('../src/command/registry');
const { loadEvents } = require('../src/event/registry');
const { CooldownManager } = require('../src/command/cooldowns');
const cooldowns = require('../src/command/cooldowns');
const { createPrefixHandler, createSlashHandler } = require('../src/command/dispatch');
const { CommandStatsService } = require('../src/database/services/commandStatsService');
const logger = require('../src/utils/logger');

function fixture(t, files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'carbon-registry-'));
  for (const [name, source] of Object.entries(files)) {
    const file = path.join(directory, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
  }
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('carbon-registry-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

test('command loader skips explicitly disabled commands and registers aliases', (t) => {
  const directory = fixture(t, {
    'info/ping.js': "module.exports = { name: 'ping', aliases: ['p'], execute() {} };",
    'info/retired.js': 'module.exports = { disabled: true };'
  });
  const commands = loadPrefixCommands(directory);
  assert.equal(commands.size, 2);
  assert.equal(commands.get('ping'), commands.get('p'));
});

test('command loader rejects malformed modules and alias/name conflicts', (t) => {
  const malformed = fixture(t, { 'info/broken.js': 'module.exports = {};' });
  assert.throws(() => loadPrefixCommands(malformed), AggregateError);
  const duplicate = fixture(t, {
    'a/first.js': "module.exports = { name: 'first', aliases: ['second'], execute() {} };",
    'b/second.js': "module.exports = { name: 'second', execute() {} };"
  });
  assert.throws(() => loadPrefixCommands(duplicate), AggregateError);
});

test('slash loader validates builders and rejects duplicate registered names', (t) => {
  const bad = fixture(t, {
    'info/broken.js': "module.exports = { data: { name: 'ping' }, execute() {} };"
  });
  assert.throws(() => loadSlashCommands(bad), AggregateError);
  const source = "module.exports = { data: { toJSON: () => ({ name: 'ping' }) }, execute() {} };";
  const duplicate = fixture(t, { 'a/one.js': source, 'b/two.js': source });
  assert.throws(() => loadSlashCommands(duplicate), AggregateError);
});

test('event validation fails before registering any listeners', (t) => {
  const client = new EventEmitter();
  const directory = fixture(t, {
    'valid.js': "module.exports = { name: 'messageCreate', execute() {} };",
    'invalid.js': "module.exports = { name: 'ready', execute: true };"
  });
  assert.throws(() => loadEvents(client, directory), AggregateError);
  assert.equal(client.eventNames().length, 0);
});

test('event wrappers contain synchronous and asynchronous failures', async (t) => {
  const client = new EventEmitter();
  const errorLog = t.mock.method(logger, 'error', () => {});
  t.mock.method(logger, 'info', () => {});
  const directory = fixture(t, {
    'sync.js': "module.exports = { name: 'sync', execute() { throw Error('sync'); } };",
    'async.js': "module.exports = { name: 'async', async execute() { throw Error('async'); } };"
  });
  loadEvents(client, directory);
  client.emit('sync');
  client.emit('async');
  await new Promise(setImmediate);
  assert.equal(errorLog.mock.callCount(), 2);
});

test('cooldown refresh survives cleanup and uses one unreferenced sweep timer', (t) => {
  const manager = new CooldownManager();
  t.after(() => manager.clear());
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  assert.equal(manager.check('u', 'ping', 1).allowed, true);
  const timer = manager._sweepTimer;
  assert.equal(timer.hasRef(), false);
  assert.deepEqual(manager.check('u', 'ping', 1), { allowed: false, remaining: 1 });
  now = 2000;
  assert.equal(manager.check('u', 'ping', 1).allowed, true);
  manager._sweep();
  assert.equal(manager._sweepTimer, timer);
  assert.equal(manager.check('u', 'ping', 1).allowed, false);
  now = 3000;
  manager._sweep();
  assert.equal(manager._cooldowns.size, 0);
  assert.equal(manager._sweepTimer, null);
});

function dispatchFixture(t, command) {
  t.mock.method(logger, 'error', () => {});
  t.mock.method(CommandStatsService, 'track', async () => {});
  t.after(() => cooldowns.clear());
  const client = {
    state: {
      commands: new Collection([['ping', command]]),
      slashCommands: new Collection([['ping', command]]),
      counts: { messagesRead: 0, commandsRan: 0, slashCommandsRan: 0, activeUsers: new Set() }
    },
    channels: { cache: new Collection() }
  };
  const replies = [];
  const message = {
    content: 'FH ping one\ntwo\tthree',
    author: { id: 'user', bot: false },
    guild: { id: 'guild', name: 'Guild' },
    member: { roles: { cache: new Collection() } },
    reply: async (payload) => { replies.push(payload); }
  };
  return { client, message, replies };
}

test('prefix dispatcher splits whitespace and applies a shared alias cooldown once', async (t) => {
  const calls = [];
  const command = { name: 'ping', cooldown: 60, execute: async (_, args) => calls.push(args) };
  const { client, message } = dispatchFixture(t, command);
  client.state.commands.set('p', command);
  const handler = createPrefixHandler(client);
  await handler(message);
  message.content = 'fh p';
  await handler(message);
  assert.deepEqual(calls, [['one', 'two', 'three']]);
  assert.equal(client.state.counts.commandsRan, 1);
});

test('permission denial does not consume cooldown and reply failures stay contained', async (t) => {
  let executed = 0;
  const command = { name: 'ping', cooldown: 60, requiredRoles: ['staff'], execute: async () => executed++ };
  const { client, message } = dispatchFixture(t, command);
  message.reply = async () => { throw new Error('Missing send permission'); };
  const handler = createPrefixHandler(client);
  await assert.doesNotReject(handler(message));
  message.member.roles.cache.set('staff', {});
  await handler(message);
  assert.equal(executed, 1);
});

test('slash failure completes its deferred response', async (t) => {
  const command = { data: { name: 'ping' }, execute: async () => { throw Error('failure'); } };
  const { client } = dispatchFixture(t, command);
  let edited = 0;
  await createSlashHandler(client)({
    isChatInputCommand: () => true,
    commandName: 'ping',
    deferred: true,
    replied: false,
    editReply: async () => edited++,
    followUp: async () => assert.fail('Should complete the original reply')
  });
  assert.equal(edited, 1);
});

test('startup validation lists missing variable names without exposing credentials', () => {
  const { validateEnvironment } = require('../src/index');
  assert.throws(() => validateEnvironment({ token: 'secret-token', mongopath: '  ' }), {
    message: 'Missing required environment variables: mongopath'
  });
  assert.doesNotThrow(() => validateEnvironment({ token: 'token', mongopath: 'mongodb://example' }));
});

test('shutdown clears background work and closes connections exactly once', async (t) => {
  const mongoose = require('mongoose');
  const { createShutdown } = require('../src/index');
  const disconnect = t.mock.method(mongoose, 'disconnect', async () => {});
  t.mock.method(logger, 'info', () => {});
  const timer = setTimeout(() => assert.fail('Shutdown left a background timer alive'), 60_000);
  t.after(() => clearTimeout(timer));
  let destroyed = 0;
  const client = {
    state: { timers: new Set([timer]) },
    destroy: async () => { destroyed++; }
  };
  const shutdown = createShutdown(client);
  await Promise.all([shutdown(), shutdown()]);
  assert.equal(destroyed, 1);
  assert.equal(disconnect.mock.callCount(), 1);
  assert.equal(client.state.shuttingDown, true);
  assert.equal(client.state.timers.size, 0);
  assert.equal(timer._destroyed, true);
});
