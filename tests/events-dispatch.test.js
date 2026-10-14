const test = require('node:test');
const assert = require('node:assert/strict');
const messageCreate = require('../src/events/messageCreate');
const logger = require('../src/utils/logger');

test('a slow feature does not delay independent message handlers', async (t) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let lastRan = false;
  for (const handler of messageCreate.handlers) t.mock.method(handler, 'execute', async () => {});
  t.mock.method(messageCreate.handlers[0], 'execute', async () => gate);
  t.mock.method(messageCreate.handlers.at(-1), 'execute', async () => { lastRan = true; });
  const processing = messageCreate.execute({ guild: {}, author: { bot: false } }, {});
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(lastRan, true);
  release();
  await processing;
});

test('feature failures are isolated and bot messages only reach supported handlers', async (t) => {
  t.mock.method(logger, 'error', () => {});
  const calls = [];
  for (const handler of messageCreate.handlers) {
    t.mock.method(handler, 'execute', async () => {
      calls.push(handler.name);
      throw new Error('Temporary feature failure');
    });
  }
  await messageCreate.execute({ guild: {}, author: { bot: true } }, {});
  assert.deepEqual(calls, messageCreate.handlers.filter((handler) => handler.acceptsBotMessages).map((handler) => handler.name));
});
