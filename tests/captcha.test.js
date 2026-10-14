const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const { ButtonStyle, Collection } = require('discord.js');
const { AntiBot } = require('../src/client/AntiBot');
const Coin = require('../src/database/models/coins');
const logger = require('../src/utils/logger');

function fixture(t) {
  const antiBot = new AntiBot();
  const collector = new EventEmitter();
  const payloads = [];
  const prompt = {
    createMessageComponentCollector: () => collector,
    edit: async () => {}
  };
  const message = {
    guild: {},
    author: { id: 'user', toString: () => '<@user>' },
    client: { users: { fetch: async () => ({ send: async () => {} }) } },
    channel: { send: async (payload) => { payloads.push(payload); return prompt; } },
    react: async () => {},
    url: 'https://discord.com/channels/guild/channel/message'
  };
  t.mock.method(logger, 'error', () => {});
  t.mock.method(logger, 'warn', () => {});
  const deletion = t.mock.method(Coin, 'findOneAndDelete', async () => ({ coins: 100 }));
  antiBot.messageCounts.set('user', antiBot.THRESHOLD - 1);
  return { antiBot, collector, payloads, message, deletion };
}

test('correct captcha remains successful when acknowledgement settles after collector end', async (t) => {
  const { antiBot, collector, payloads, message, deletion } = fixture(t);
  const result = antiBot.check(message);
  await new Promise(setImmediate);
  const correctButton = payloads[0].components[0].components.find((button) => button.data.style === ButtonStyle.Danger);
  let acknowledge;
  const button = { customId: correctButton.data.custom_id, deferUpdate: () => new Promise((resolve) => { acknowledge = resolve; }) };
  collector.emit('end', new Collection([['click', button]]), 'limit');
  await new Promise(setImmediate);
  assert.equal(deletion.mock.callCount(), 0);
  assert.equal(antiBot.processing.has('user'), true);
  acknowledge();
  assert.equal(await result, false);
  assert.equal(deletion.mock.callCount(), 0);
  assert.match(payloads[1].content, /continue using/);
  assert.equal(antiBot.processing.size, 0);
});

test('failed prompt send cannot strand a user or wipe their balance', async (t) => {
  const { antiBot, message, deletion } = fixture(t);
  message.channel.send = async () => { throw Error('Missing access'); };
  assert.equal(await antiBot.check(message), false);
  assert.equal(antiBot.processing.size, 0);
  assert.equal(antiBot.messageCounts.size, 0);
  assert.equal(deletion.mock.callCount(), 0);
});

test('deleted captcha message does not count as a failure', async (t) => {
  const { antiBot, collector, message, deletion } = fixture(t);
  const result = antiBot.check(message);
  await new Promise(setImmediate);
  collector.emit('end', new Collection(), 'messageDelete');
  await result;
  assert.equal(deletion.mock.callCount(), 0);
  assert.equal(antiBot.processing.size, 0);
});

test('timeout releases user even when notification and prompt cleanup fail', async (t) => {
  const { antiBot, collector, message, deletion } = fixture(t);
  message.client.users.fetch = async () => ({ send: async () => { throw Error('DM disabled'); } });
  const result = antiBot.check(message);
  await new Promise(setImmediate);
  message.channel.send = async () => { throw Error('Channel deleted'); };
  collector.emit('end', new Collection(), 'time');
  await result;
  assert.equal(deletion.mock.callCount(), 1);
  assert.equal(antiBot.processing.size, 0);
});
