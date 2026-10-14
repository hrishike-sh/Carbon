const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const seasonal = require('../src/events/event2025');
const Team = require('../src/database/models/teams');
const config = require('../src/config');
const manualEvents = require('../src/commands/2025/events');

const flush = () => new Promise((resolve) => setImmediate(resolve));

function gameFixture() {
  const payloads = [];
  const collectors = [];
  const collect = () => {
    const collector = new EventEmitter();
    collector.stop = () => collector.emit('end');
    collectors.push(collector);
    return collector;
  };
  const message = {
    edit: async (payload) => { payloads.push(payload); return message; },
    createMessageComponentCollector: collect
  };
  const client = { state: {}, users: { cache: new Map() } };
  const channel = {
    client,
    send: async (payload) => { payloads.push(payload); return message; },
    createMessageCollector: collect
  };
  return { client, channel, payloads, collectors };
}

test('shared runner rejects invalid event indices before sending messages', async () => {
  const fixture = gameFixture();
  for (const index of [-1, 8, 1.5, '0', null, NaN]) {
    await assert.rejects(seasonal.runEvent(fixture.client, fixture.channel, index), RangeError);
  }
  assert.equal(fixture.payloads.length, 0);
});

test('all eight event indices route to a game without contacting external services', async (t) => {
  t.mock.method(global, 'setTimeout', (callback) => {
    queueMicrotask(callback);
    return { unref() {} };
  });
  t.mock.method(global, 'setInterval', () => ({ unref() {} }));
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ['test'] }));
  const expectedTitles = [
    'Guess where the ball is!', 'Memorize', null, 'Crab Race :crab:',
    'Higher or Lower', 'Guess the word!', 'Rock, Paper, Scissors', 'Guess the Number!'
  ];
  for (let index = 0; index < 8; index++) {
    const fixture = gameFixture();
    await seasonal.runEvent(fixture.client, fixture.channel, index);
    assert.equal(fixture.collectors.length, 1, `event ${index} collector`);
    if (expectedTitles[index]) {
      assert.ok(fixture.payloads.some((payload) => payload.embeds?.[0]?.data?.title === expectedTitles[index]), `event ${index} title`);
    }
  }
});

test('manual event winner receives no team reward or lootbox reset', async (t) => {
  const award = t.mock.method(Team, 'findOneAndUpdate', async () => { throw new Error('Manual reward forbidden'); });
  const save = t.mock.method(Team.prototype, 'save', async () => { throw new Error('Manual reset forbidden'); });
  const fixture = gameFixture();
  await manualEvents.execute({ channel: fixture.channel }, ['0'], fixture.client);
  fixture.collectors[0].emit('collect', {
    customId: 'ball',
    user: { id: 'winner', displayAvatarURL: () => 'https://example.com/avatar.png', toString: () => '<@winner>' },
    reply: async () => {}
  });
  await flush();
  assert.equal(award.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);
  const winner = fixture.payloads.find((payload) => payload.embeds?.[0]?.data?.title === '🎉 Event Winner! 🎉');
  assert.ok(winner);
  assert.equal(winner.embeds[0].data.fields, undefined);
});

test('manual command validates input and supports a random game when omitted', async (t) => {
  const fixture = gameFixture();
  let replies = 0;
  const message = { channel: fixture.channel, reply: async () => { replies++; } };
  await manualEvents.execute(message, ['8'], fixture.client);
  assert.equal(replies, 1);
  assert.equal(fixture.payloads.length, 0);
  t.mock.method(Math, 'random', () => 0);
  await manualEvents.execute(message, [], fixture.client);
  assert.equal(fixture.collectors.length, 1);
});

test('seasonal game acknowledges and stops before an award completes, with one winner', async (t) => {
  let tick;
  t.mock.method(global, 'setInterval', (callback) => { tick = callback; return { unref() {} }; });
  t.mock.method(global, 'setTimeout', (callback) => {
    queueMicrotask(callback);
    return { unref() {} };
  });
  t.mock.method(Math, 'random', () => 0);
  let releaseAward;
  const awardGate = new Promise((resolve) => { releaseAward = resolve; });
  const award = t.mock.method(Team, 'findOneAndUpdate', async () => awardGate);
  const collector = new EventEmitter();
  let stopped = false;
  collector.stop = () => { stopped = true; collector.emit('end'); };
  const channel = {
    send: async () => ({ createMessageComponentCollector: () => collector })
  };
  const client = { state: {}, channels: { cache: new Map([[config.ids.channels.event2025, channel]]) } };
  await seasonal.execute(client);
  await tick();
  const replies = [];
  const user = (id) => ({ id, displayAvatarURL: () => 'https://example.com/avatar.png', toString: () => `<@${id}>` });
  collector.emit('collect', { customId: 'ball', user: user('first'), reply: async (reply) => replies.push(reply) });
  collector.emit('collect', { customId: 'ball', user: user('second'), reply: async (reply) => replies.push(reply) });
  assert.equal(stopped, true);
  assert.equal(replies.length, 2);
  await flush();
  assert.equal(award.mock.callCount(), 1);
  releaseAward(null);
  await flush();
});
