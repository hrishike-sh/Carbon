const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const Coin = require('../src/database/models/coins');
const { CoinService, InsufficientFundsError } = require('../src/database/services/coinService');
const cooldowns = require('../src/command/cooldowns');
const antiBot = require('../src/client/AntiBot');
const config = require('../src/config');
const { calculateScore, createDeck } = require('../src/commands/currency/lib/blackjack');

const flush = () => new Promise((resolve) => setImmediate(resolve));
class Collector extends EventEmitter {
  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.emit('end', new Map(), reason);
  }
}
function user(id) {
  return { id, username: id, tag: id, bot: false, toString: () => `<@${id}>`, displayAvatarURL: () => 'https://example.com/avatar.png' };
}
function makeMessage(collector = new Collector()) {
  const author = user('player');
  const sent = [];
  const reply = {
    createMessageComponentCollector: () => collector,
    edit: async (payload) => { sent.push(payload); }
  };
  return {
    author, member: { displayName: 'Player' }, guild: { id: config.ids.guildId },
    channel: { id: 'test-channel', parentId: 'test-category', createMessageCollector: () => collector, send: async () => reply },
    reply: async (payload) => { sent.push(payload); return reply; },
    sent
  };
}
function button(id = 'stand', player = 'player') {
  return { customId: id, user: user(player), deferUpdate: async () => {}, reply: async () => {}, followUp: async () => {} };
}

test.afterEach(() => {
  cooldowns.unlock('player');
  cooldowns.unlock('opponent');
});

test('balance reads do not create database rows', async (t) => {
  t.mock.method(Coin, 'findOne', () => ({ select: () => ({ lean: async () => null }) }));
  const write = t.mock.method(Coin, 'findOneAndUpdate', async () => { throw new Error('unexpected write'); });
  assert.equal(await CoinService.getBalance('absent'), 0);
  assert.equal(write.mock.callCount(), 0);
});

test('concurrent first awards serialize without losing increments', async (t) => {
  let balance = 0;
  let active = 0;
  let maxActive = 0;
  t.mock.method(Coin, 'findOneAndUpdate', async (_, update) => {
    active++;
    maxActive = Math.max(maxActive, active);
    await flush();
    balance += update.$inc.coins;
    active--;
    return { coins: balance };
  });
  await Promise.all(Array.from({ length: 8 }, () => CoinService.addCoins('new-user', 5)));
  assert.equal(balance, 40);
  assert.equal(maxActive, 1);
  assert.equal(CoinService._pendingUpserts.size, 0);
});

test('an upsert failure does not block subsequent awards', async (t) => {
  let calls = 0;
  t.mock.method(Coin, 'findOneAndUpdate', async () => {
    if (++calls === 1) throw new Error('temporary failure');
    return { coins: 5 };
  });
  const results = await Promise.allSettled([CoinService.addCoins('retry-user', 5), CoinService.addCoins('retry-user', 5)]);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(CoinService._pendingUpserts.size, 0);
});

test('failed transfer credits compensate the debit', async (t) => {
  const error = new Error('credit failed');
  const deltas = [];
  t.mock.method(CoinService, 'removeCoins', async (id, amount) => deltas.push([id, -amount]));
  t.mock.method(CoinService, 'addCoins', async (id, amount) => {
    if (id === 'recipient') throw error;
    deltas.push([id, amount]);
  });
  await assert.rejects(CoinService.transfer('sender', 'recipient', 10), (err) => err === error);
  assert.deepEqual(deltas, [['sender', -10], ['sender', 10]]);
});

test('self-transfers and invalid amounts do not debit', async (t) => {
  const debit = t.mock.method(CoinService, 'removeCoins', async () => {});
  await assert.rejects(CoinService.transfer('same', 'same', 10), RangeError);
  await assert.rejects(CoinService.transfer('sender', 'recipient', Infinity), RangeError);
  assert.equal(debit.mock.callCount(), 0);
});

test('blackjack handles every ace as one or eleven', () => {
  assert.equal(createDeck().length, 52);
  assert.equal(calculateScore([{ value: 'A' }, { value: 'A' }, { value: 'A' }, { value: '9' }]), 12);
  assert.equal(calculateScore([{ value: 'A' }, { value: 'K' }]), 21);
});

test('blackjack starts after dispatcher cooldown and refunds failed setup', async (t) => {
  const blackjack = require('../src/commands/currency/blackjack');
  t.mock.method(antiBot, 'check', async () => true);
  t.mock.method(cooldowns, 'check', () => ({ allowed: false }));
  const debit = t.mock.method(CoinService, 'removeCoins', async () => ({ coins: 90 }));
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({ coins: 100 }));
  const message = makeMessage();
  message.reply = async () => { throw new Error('Discord unavailable'); };
  await assert.rejects(blackjack.execute(message, ['10']), /Discord unavailable/);
  assert.equal(debit.mock.callCount(), 1);
  assert.deepEqual(credit.mock.calls[0].arguments, ['player', 10]);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('blackjack repeated stand interactions pay once and keep the lock during payout', async (t) => {
  const blackjack = require('../src/commands/currency/blackjack');
  t.mock.method(antiBot, 'check', async () => true);
  t.mock.method(Math, 'random', () => 0.999); // Initial scores: player 21, dealer 20.
  t.mock.method(CoinService, 'removeCoins', async () => ({ coins: 90 }));
  let release;
  const credit = t.mock.method(CoinService, 'addCoins', () => new Promise((resolve) => { release = resolve; }));
  const collector = new Collector();
  await blackjack.execute(makeMessage(collector), ['10']);
  collector.emit('collect', button());
  collector.emit('collect', button());
  await flush();
  assert.equal(credit.mock.callCount(), 1);
  assert.equal(cooldowns.isLocked('player'), true);
  release({ coins: 100 });
  await flush();
  assert.equal(cooldowns.isLocked('player'), false);
});

test('number game invalid guesses retain the lock, simultaneous wins pay once', async (t) => {
  const numberGame = require('../src/commands/currency/numbergame');
  t.mock.method(Math, 'random', () => 0);
  t.mock.method(CoinService, 'removeCoins', async () => ({}));
  let release;
  const credit = t.mock.method(CoinService, 'addCoins', () => new Promise((resolve) => { release = resolve; }));
  const collector = new Collector();
  await numberGame.execute(makeMessage(collector), ['10']);
  collector.emit('collect', { content: 'not a number', reply: async () => {} });
  await flush();
  assert.equal(cooldowns.isLocked('player'), true);
  collector.emit('collect', { content: '1', reply: async () => {} });
  collector.emit('collect', { content: '1', reply: async () => {} });
  assert.equal(credit.mock.callCount(), 1);
  assert.equal(cooldowns.isLocked('player'), true);
  release({ coins: 100 });
  await flush();
  assert.equal(cooldowns.isLocked('player'), false);
});

test('number game rejects an overflowing payout before taking a stake', async (t) => {
  const numberGame = require('../src/commands/currency/numbergame');
  const debit = t.mock.method(CoinService, 'removeCoins', async () => ({}));
  await numberGame.execute(makeMessage(), ['9007199254740991']);
  assert.equal(debit.mock.callCount(), 0);
});

test('dice reserves a stake and returns it when the rounded profit is zero', async (t) => {
  const dice = require('../src/commands/currency/dice');
  const rolls = [0, 0.99, 0];
  t.mock.method(Math, 'random', () => rolls.shift());
  const debit = t.mock.method(CoinService, 'removeCoins', async () => ({ coins: 9 }));
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({ coins: 10 }));
  await dice.execute(makeMessage(), ['1']);
  assert.deepEqual(debit.mock.calls[0].arguments, ['player', 1]);
  assert.deepEqual(credit.mock.calls[0].arguments, ['player', 1]);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('dice releases game lock when a stake debit fails', async (t) => {
  const dice = require('../src/commands/currency/dice');
  t.mock.method(CoinService, 'removeCoins', async () => { throw new Error('database unavailable'); });
  await assert.rejects(dice.execute(makeMessage(), ['10']), /database unavailable/);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('dice does not roll or pay out when a concurrent spend exhausts the balance', async (t) => {
  const dice = require('../src/commands/currency/dice');
  const random = t.mock.method(Math, 'random', () => 0);
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({}));
  t.mock.method(CoinService, 'removeCoins', async () => { throw new InsufficientFundsError('player', 10); });
  const message = makeMessage();
  await dice.execute(message, ['10']);
  assert.equal(random.mock.callCount(), 0);
  assert.equal(credit.mock.callCount(), 0);
  assert.equal(message.sent[0], "You don't have that much money!");
  assert.equal(cooldowns.isLocked('player'), false);
});

test('dice does not refund a settled loss when the Discord reply fails', async (t) => {
  const dice = require('../src/commands/currency/dice');
  const rolls = [0.99, 0, 0];
  t.mock.method(Math, 'random', () => rolls.shift());
  t.mock.method(CoinService, 'removeCoins', async () => ({ coins: 90 }));
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({}));
  const message = makeMessage();
  message.reply = async () => { throw new Error('Discord unavailable'); };
  await assert.rejects(dice.execute(message, ['10']), /Discord unavailable/);
  assert.equal(credit.mock.callCount(), 0);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('dice refunds an unstarted game after a local setup error', async (t) => {
  const dice = require('../src/commands/currency/dice');
  t.mock.method(CoinService, 'removeCoins', async () => ({ coins: 90 }));
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({}));
  const message = makeMessage();
  message.author.displayAvatarURL = () => { throw new Error('setup failed'); };
  await assert.rejects(dice.execute(message, ['10']), /setup failed/);
  assert.deepEqual(credit.mock.calls.map((call) => call.arguments), [['player', 10]]);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('fight refunds first stake when second debit fails and only accepts once', async (t) => {
  const fight = require('../src/commands/currency/fight');
  t.mock.method(CoinService, 'getBalance', async () => 100);
  const debit = t.mock.method(CoinService, 'removeCoins', async (id) => {
    if (id === 'opponent') throw new InsufficientFundsError(id, 10);
  });
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({}));
  const collector = new Collector();
  const message = makeMessage(collector);
  const opponent = user('opponent');
  message.mentions = { members: { first: () => ({ id: opponent.id, user: opponent, toString: opponent.toString }) } };
  await fight.execute(message, ['<@opponent>', '10']);
  collector.emit('collect', button('confirm', 'opponent'));
  collector.emit('collect', button('confirm', 'opponent'));
  await flush();
  assert.equal(debit.mock.callCount(), 2);
  assert.deepEqual(credit.mock.calls.map((call) => call.arguments), [['player', 10]]);
  assert.equal(cooldowns.isLocked('player'), false);
  assert.equal(cooldowns.isLocked('opponent'), false);
});

test('accepted fight retains locks through payout and pays timeout winner once', async (t) => {
  const fight = require('../src/commands/currency/fight');
  t.mock.method(CoinService, 'getBalance', async () => 100);
  t.mock.method(CoinService, 'removeCoins', async () => ({}));
  let release;
  const credit = t.mock.method(CoinService, 'addCoins', () => new Promise((resolve) => { release = resolve; }));
  const confirmation = new Collector();
  const game = new Collector();
  const message = makeMessage();
  let sends = 0;
  message.channel.send = async () => ({
    createMessageComponentCollector: () => (++sends === 1 ? confirmation : game),
    edit: async () => {}
  });
  const opponent = user('opponent');
  message.mentions = { members: { first: () => ({ id: opponent.id, user: opponent, toString: opponent.toString }) } };
  await fight.execute(message, ['<@opponent>', '10']);
  confirmation.emit('collect', button('confirm', 'opponent'));
  await flush();
  assert.equal(cooldowns.isLocked('player'), true);
  assert.equal(cooldowns.isLocked('opponent'), true);
  game.stop('idle');
  game.stop('idle');
  assert.equal(credit.mock.callCount(), 1);
  assert.equal(cooldowns.isLocked('player'), true);
  release({ coins: 110 });
  await flush();
  assert.equal(cooldowns.isLocked('player'), false);
  assert.equal(cooldowns.isLocked('opponent'), false);
});

test('beg coinflip stakes the displayed balance once and acknowledges the button', async (t) => {
  const beg = require('../src/commands/currency/beg');
  t.mock.method(antiBot, 'check', async () => true);
  t.mock.method(Math, 'random', () => 0);
  t.mock.method(CoinService, 'getBalance', async () => 100);
  const credit = t.mock.method(CoinService, 'addCoins', async () => ({}));
  const debit = t.mock.method(CoinService, 'removeCoins', async () => ({}));
  const collector = new Collector();
  await beg.execute(makeMessage(collector), []);
  const interaction = button('yes');
  const acknowledge = t.mock.method(interaction, 'deferUpdate', async () => {});
  collector.emit('collect', interaction);
  collector.emit('collect', interaction);
  await flush();
  assert.equal(acknowledge.mock.callCount(), 1);
  assert.deepEqual(debit.mock.calls.map((call) => call.arguments), [['player', 100]]);
  assert.deepEqual(credit.mock.calls.map((call) => call.arguments), [['player', 50], ['player', 200]]);
  assert.equal(cooldowns.isLocked('player'), false);
});

test('unanswered two-player blackjack challenges expire without a collect event', async () => {
  const blackjack = require('../src/commands/currency/2playerblackjack');
  const collector = new Collector();
  const message = makeMessage(collector);
  message.mentions = { users: { first: () => user('opponent') } };
  await blackjack.execute(message, []);
  collector.stop('time');
  await flush();
  assert.equal(message.sent.at(-1).content, 'The challenge has expired.');
  assert.deepEqual(message.sent.at(-1).components, []);
});

test('concurrent settings loads share a single upsert', async (t) => {
  const settings = require('../src/database/services/settingsService');
  const Settings = require('../src/database/models/settingsSchema');
  const cached = settings._cache;
  t.after(() => { settings._cache = cached; });
  const expected = { guildID: config.guildId, afkIgnore: [] };
  const query = t.mock.method(Settings, 'findOneAndUpdate', () => ({ exec: async () => { await flush(); return expected; } }));
  const results = await Promise.all([settings.load(), settings.load()]);
  assert.equal(query.mock.callCount(), 1);
  assert.deepEqual(results, [expected, expected]);
});
