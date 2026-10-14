const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { parseAmount } = require('../src/utils/validators');
const { breakArray } = require('../src/utils/helpers');
const { onAsync, startInterval } = require('../src/utils/asyncEvents');
const logger = require('../src/utils/logger');

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('amount parsing rejects zero, overflow and unsafe scaled integers', () => {
  for (const input of ['0', '0.5', '1e309', '9007199254740992', '1e308b', '-1', 'abc']) {
    assert.equal(parseAmount(input), null, input);
  }
  assert.equal(parseAmount('1.5k'), 1500);
  assert.equal(parseAmount('1e3'), 1000);
  assert.equal(parseAmount('0.01k'), 10);
  assert.equal(parseAmount('9007199254740991'), Number.MAX_SAFE_INTEGER);
});

test('invalid chunk sizes fail immediately instead of looping forever', () => {
  for (const size of [0, -1, 0.5, Infinity, NaN]) {
    assert.throws(() => breakArray([1, 2, 3], size), RangeError);
  }
  assert.deepEqual(breakArray([1, 2, 3], 2), [[1, 2], [3]]);
});

test('async collector listeners contain synchronous and asynchronous failures', async (t) => {
  const errors = [];
  t.mock.method(logger, 'error', (...args) => errors.push(args));
  const emitter = new EventEmitter();
  onAsync(emitter, 'sync', () => { throw new Error('sync'); });
  onAsync(emitter, 'async', async () => { throw new Error('async'); });
  emitter.emit('sync');
  emitter.emit('async');
  await flush();
  assert.equal(errors.length, 2);
});

test('collector handlers claim state synchronously before end can fire', () => {
  const emitter = new EventEmitter();
  const joined = [];
  onAsync(emitter, 'collect', async (id) => { joined.push(id); });
  emitter.emit('collect', 'user');
  assert.deepEqual(joined, ['user']);
});

test('logger honors environment configured after module import', (t) => {
  const previous = process.env.LOG_LEVEL;
  t.after(() => {
    if (previous === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = previous;
  });
  const output = t.mock.method(console, 'log', () => {});
  process.env.LOG_LEVEL = 'error';
  logger.info('hidden');
  process.env.LOG_LEVEL = 'debug';
  logger.info('visible');
  assert.equal(output.mock.callCount(), 1);
});

test('background intervals skip overlapping ticks and recover after failures', async (t) => {
  let tick;
  const timer = { unref: () => {} };
  t.mock.method(global, 'setInterval', (callback) => { tick = callback; return timer; });
  t.mock.method(logger, 'error', () => {});
  let release;
  let calls = 0;
  const gate = new Promise((resolve) => { release = resolve; });
  const client = { state: {} };
  startInterval(client, async () => {
    calls++;
    await gate;
    throw new Error('Temporary failure');
  }, 30_000, 'Test job');
  const first = tick();
  await tick();
  await tick();
  assert.equal(calls, 1);
  assert.ok(client.state.timers.has(timer));
  release();
  await first;
  await tick();
  assert.equal(calls, 2);
  client.state.shuttingDown = true;
  await tick();
  assert.equal(calls, 2);
  assert.equal(startInterval(client, () => {}, 30_000, 'Late job'), null);
});
