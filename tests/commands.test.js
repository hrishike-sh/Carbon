const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Collection, PermissionFlagsBits, ButtonStyle } = require('discord.js');
const config = require('../src/config');

const USER_ID = '123456789012345678';
const GUILD_ID = '223456789012345678';

function messageStub() {
  const replies = [];
  const user = { id: USER_ID, tag: 'tester', toString: () => `<@${USER_ID}>` };
  return {
    replies,
    author: user,
    member: { roles: { cache: { has: () => true } } },
    mentions: { users: { first: () => user } },
    guild: { id: GUILD_ID, members: { fetch: async () => user, cache: new Map() } },
    reply: async (payload) => { replies.push(payload); return payload; }
  };
}

for (const [commandName, modelName, field] of [
  ['donoadd', 'main_dono', 'messages'], ['grinder', 'grinder_dono', 'amount'], ['karuta', 'tickets', 'amount']
]) {
  test(`${commandName} normalizes ADD and applies one atomic increment`, async (t) => {
    const model = require(`../src/database/models/${modelName}`);
    const writes = [];
    t.mock.method(model, 'findOneAndUpdate', async (filter, update, options) => {
      writes.push({ filter, update, options });
      return { [field]: 1500 };
    });
    const command = require(`../src/commands/donations/${commandName}`);
    const message = messageStub();
    await command.execute(message, [USER_ID, 'ADD', '1.5k']);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].update.$inc[field], 1500);
    assert.equal(writes[0].options.upsert, true);
    assert.equal(message.replies[0].embeds[0].title, 'Amount Added');

    await command.execute(message, [USER_ID, 'REMOVE', '1k']);
    assert.equal(writes[1].update.$inc[field], -1000);
    assert.equal(message.replies[1].embeds[0].title, 'Amount Removed');
  });

  test(`${commandName} rejects overflowing or nonpositive amounts before writes`, async (t) => {
    const model = require(`../src/database/models/${modelName}`);
    const update = t.mock.method(model, 'findOneAndUpdate', async () => { throw new Error('Unexpected write'); });
    const command = require(`../src/commands/donations/${commandName}`);
    const message = messageStub();
    for (const amount of ['1e309', '9007199254740992', '-1', '0', 'NaN']) {
      await command.execute(message, [USER_ID, '+', amount]);
    }
    assert.equal(update.mock.callCount(), 0);
  });
}

test('grinderday rejects invalid days and updates the expiry atomically', async (t) => {
  const model = require('../src/database/models/grinder_dono');
  const update = t.mock.method(model, 'findOneAndUpdate', async () => ({ dynamic: { expires: 1900000000000 } }));
  const command = require('../src/commands/grinders/days');
  const message = messageStub();
  for (const days of ['Infinity', 'nope', '1.5', '0', '9007199254740991']) {
    await command.execute(message, [USER_ID, days]);
  }
  assert.equal(update.mock.callCount(), 0);
  await command.execute(message, [USER_ID, '-2']);
  assert.equal(update.mock.calls[0].arguments[1].$inc['dynamic.expires'], -2 * 86400000);
  assert.equal(update.mock.calls[0].arguments[0].guildID, GUILD_ID);
});

test('eval preserves client configuration and redacts secrets in input, output and attachments', async () => {
  const command = require('../src/commands/dev/eval');
  const key = 'CARBON_TEST_API_KEY';
  const original = process.env[key];
  process.env[key] = 'secret.with[regex]+characters';
  try {
    const payloads = [];
    const client = { config: { sentinel: true }, channels: { cache: new Map() } };
    const message = {
      author: { id: config.ids.devUserIds[0], tag: 'developer' },
      channel: { send: async (payload) => payloads.push(payload) }
    };
    await command.execute(message, [`'${process.env[key]}' + 'x'.repeat(1100)`], client);
    assert.deepEqual(client.config, { sentinel: true });
    const output = JSON.stringify(payloads[0].embeds[0].toJSON());
    assert.ok(output.includes('[REDACTED]'));
    assert.ok(!output.includes(process.env[key]));
    assert.equal(payloads[0].files.length, 1);
    const attachment = payloads[0].files[0].attachment.toString();
    assert.ok(attachment.startsWith('[REDACTED]'));
    assert.ok(!attachment.includes(process.env[key]));
  } finally {
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

function queryStub(value) {
  return { sort() { return this; }, limit() { return this; }, select() { return this; }, lean: async () => value };
}

test('donation leaderboard bounds queries and deduplicates Discord user fetches', async (t) => {
  const models = ['main_dono', 'grinder_dono', 'tickets'].map((name) => require(`../src/database/models/${name}`));
  const limits = [];
  models.forEach((model, index) => {
    const field = index === 0 ? 'messages' : 'amount';
    const userField = index === 2 ? 'userId' : 'userID';
    t.mock.method(model, 'find', (filter) => {
      if (index < 2) assert.equal(filter.guildID, GUILD_ID);
      const query = queryStub([{ _id: 'a', [field]: 100, [userField]: USER_ID }]);
      query.limit = (limit) => { limits.push(limit); return query; };
      return query;
    });
    t.mock.method(model, 'findOne', () => queryStub(null));
  });
  const edits = [];
  const reply = { edit: async (payload) => edits.push(payload), createMessageComponentCollector: () => ({ on() {} }) };
  const message = messageStub();
  message.reply = async () => reply;
  let fetchCount = 0;
  const client = { users: { fetch: async () => { fetchCount++; return null; } } };
  await require('../src/commands/donations/leaderboard').execute(message, [], client);
  assert.deepEqual(limits, [10, 10, 10]);
  assert.equal(fetchCount, 1);
  assert.match(edits[0].embeds[0].data.description, /Unknown user/);
  assert.equal(edits[0].components[0].components.length, 3);
});

function pingInteraction(guildId, send) {
  const calls = [];
  return {
    calls, guildId, channelId: '853280287777882142',
    member: { roles: { cache: { hasAny: () => true } } },
    options: {
      getString: (name) => name === 'role' ? config.roles.pingRoles.mafia : name === 'prize' ? 'Prize' : null,
      getBoolean: () => true,
      getUser: () => ({ id: USER_ID, toString: () => `<@${USER_ID}>` })
    },
    channel: { send: async (payload) => { calls.push(['send', payload]); return send?.(); } },
    deferReply: async () => calls.push(['defer']),
    editReply: async (payload) => calls.push(['edit', payload]),
    reply: async (payload) => calls.push(['reply', payload])
  };
}

test('mafia ping acknowledges first, sends once, and enforces the shared role cooldown', async () => {
  const command = require('../src/slash-commands/mods/ping-role');
  const interaction = pingInteraction('mafia-success');
  await command.execute(interaction);
  assert.deepEqual(interaction.calls.map(([type]) => type), ['defer', 'send', 'edit']);
  assert.match(interaction.calls[1][1].embeds[0].data.description, /Mafia/);
  const again = pingInteraction('mafia-success');
  await command.execute(again);
  assert.match(again.calls[0][1].content, /cooldown/);
});

test('failed role ping releases cooldown so it can be retried', async () => {
  const command = require('../src/slash-commands/mods/ping-role');
  await assert.rejects(command.execute(pingInteraction('mafia-failure', () => { throw new Error('Denied'); })), /Denied/);
  const retry = pingInteraction('mafia-failure');
  await command.execute(retry);
  assert.deepEqual(retry.calls.map(([type]) => type), ['defer', 'send', 'edit']);
});

function guessMessage(originalSend, timeout = false) {
  const permissions = [];
  const button = { reply: async () => {} };
  const prompt = {
    edit: async () => {},
    awaitMessageComponent: async () => {
      if (timeout) throw Object.assign(new Error('Timed out'), { code: 'InteractionCollectorError' });
      return button;
    }
  };
  const message = messageStub();
  message.guild.roles = { everyone: { id: 'everyone' } };
  message.channel = {
    id: `guess-${originalSend}-${timeout}`,
    permissionOverwrites: {
      cache: new Map([['everyone', {
        deny: { has: (flag) => flag === PermissionFlagsBits.SendMessages && originalSend === false },
        allow: { has: () => originalSend === true }
      }]]),
      edit: async (_, permissionsUpdate) => permissions.push(permissionsUpdate.SendMessages)
    },
    send: async () => prompt,
    awaitMessages: async (options) => {
      assert.equal(options.time, 15 * 60 * 1000);
      assert.equal(options.filter({ author: { bot: true }, content: '0' }), false);
      return new Collection();
    }
  };
  return { message, permissions };
}

test('Guess the Number restores the original permission after timeout or completion', async () => {
  const command = require('../src/commands/fun/guessthenumber');
  for (const original of [true, false, null]) {
    const complete = guessMessage(original);
    await command.execute(complete.message, ['10']);
    assert.deepEqual(complete.permissions, [false, true, original]);
    const cancelled = guessMessage(original, true);
    await command.execute(cancelled.message, ['10']);
    assert.deepEqual(cancelled.permissions, [false, original]);
  }
});

test('Guess the Number rejects unsafe limits without changing channel permissions', async () => {
  const command = require('../src/commands/fun/guessthenumber');
  const { message, permissions } = guessMessage(null);
  for (const amount of ['Infinity', '-1', '1.5', '0', '9007199254740991']) {
    await command.execute(message, [amount]);
  }
  assert.deepEqual(permissions, []);
});

class FakeCollector extends EventEmitter {
  ended = false;
  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.emit('end', new Collection(), reason);
  }
}

test('donation requests can retry a failed acknowledgement and report closed DMs accurately', async (t) => {
  const collector = new FakeCollector();
  const sent = { edit: async () => {}, createMessageComponentCollector: () => collector };
  const message = messageStub();
  message.author.displayAvatarURL = () => 'https://example.com/avatar.png';
  message.author.send = async () => { throw new Error('DMs disabled'); };
  message.channel = { id: '857223712193511434', send: async () => sent };
  t.mock.method(console, 'error', () => {});
  await require('../src/commands/donations/donate').execute(message, ['coins, none, trivia']);
  const collect = collector.listeners('collect')[0];
  const button = {
    member: message.member, user: message.author, customId: 'donate_accept',
    deferReply: async () => { throw new Error('ACK failed'); }
  };
  await collect(button);
  assert.equal(collector.ended, false);
  let response;
  button.deferReply = async () => {};
  button.editReply = async (payload) => { response = payload.content; };
  await collect(button);
  assert.equal(collector.ended, true);
  assert.match(response, /could not DM/);
});

test('Battle Royale reserves a winner before acknowledgement and ignores late attacks', async (t) => {
  const helpers = require('../src/utils/helpers');
  t.mock.method(helpers, 'sleep', async () => {});
  t.mock.method(Math, 'random', () => 0.999);
  const commandPath = require.resolve('../src/commands/fun/battleroyale');
  delete require.cache[commandPath];
  const command = require(commandPath);
  t.after(() => delete require.cache[commandPath]);
  const collectors = [];
  const messages = [];
  const message = messageStub();
  message.channel = { send: async () => {
    const collector = new FakeCollector();
    collectors.push(collector);
    const sent = {
      edits: [],
      edit: async (payload) => { sent.edits.push(JSON.parse(JSON.stringify(payload))); return sent; },
      createMessageComponentCollector: () => collector
    };
    messages.push(sent);
    return sent;
  } };
  await command.execute(message, [], {});
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  for (const id of ['a', 'b', 'c']) {
    collectors[0].emit('collect', { user: { id, tag: id }, reply: async () => {} });
  }
  await tick();
  collectors[0].stop('time');
  await tick();
  collectors[1].stop('time');
  await tick();
  const main = collectors[2];
  const attack = (target, deferUpdate = async () => {}) => ({
    user: { id: 'a', username: 'a' }, customId: `br_${target}_1`, deferUpdate, reply: async () => {}
  });
  for (let i = 0; i < 7; i++) {
    main.emit('collect', attack('b'));
    await tick();
  }
  for (let i = 0; i < 6; i++) {
    main.emit('collect', attack('c'));
    await tick();
  }
  let acknowledge;
  main.emit('collect', attack('c', () => new Promise((resolve) => { acknowledge = resolve; })));
  await tick();
  assert.equal(main.ended, true, 'winner must be reserved before Discord acknowledges the attack');
  main.emit('collect', { user: { id: 'c' }, customId: 'br_a_1', deferUpdate: async () => {} });
  await tick();
  acknowledge();
  await tick();
  const winnerEdits = messages[2].edits.filter((payload) => payload.embeds?.[0]?.description?.includes('has won'));
  assert.equal(winnerEdits.length, 1);
  assert.match(winnerEdits[0].embeds[0].description, /<@a>/);
  assert.deepEqual(winnerEdits[0].components, []);
});

async function startWordle(t, channelId, answer, dictionary) {
  const collector = new FakeCollector();
  const edits = [];
  const requests = [];
  const replies = [];
  const message = messageStub();
  message.channel = { id: channelId, createMessageCollector: (options) => {
    assert.equal(options.time, 10 * 60 * 1000);
    assert.equal(options.idle, 2 * 60 * 1000);
    return collector;
  } };
  message.reply = async (payload) => {
    replies.push(payload);
    return { edit: async (value) => edits.push(JSON.parse(JSON.stringify(value))) };
  };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push(url);
    assert.ok(options.signal instanceof AbortSignal);
    if (url.includes('random-word')) return { ok: true, json: async () => [answer] };
    return dictionary ? dictionary(url) : { ok: true, json: async () => [{}] };
  });
  await require('../src/commands/fun/wordle').execute(message);
  t.after(() => collector.stop('test'));
  const guess = (content) => collector.emit('collect', {
    content, author: message.author, reply: async (payload) => replies.push(payload)
  });
  return { collector, edits, requests, replies, guess, message };
}

test('Wordle counts duplicate letters only as often as they occur in the answer', async (t) => {
  const game = await startWordle(t, 'wordle-duplicates', 'apple');
  game.guess('allee');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(game.edits[0].components[0].components.map((button) => button.style), [
    ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Success
  ]);
});

test('Wordle serializes dictionary lookups and ignores a sixth queued guess', async (t) => {
  let release;
  let dictionaryCalls = 0;
  const game = await startWordle(t, 'wordle-queue', 'apple', async () => {
    dictionaryCalls++;
    if (dictionaryCalls === 1) await new Promise((resolve) => { release = resolve; });
    return { ok: true, json: async () => [{}] };
  });
  for (const word of ['crane', 'ghost', 'brick', 'cloud', 'flame', 'apple']) game.guess(word);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(dictionaryCalls, 1);
  assert.equal(game.edits.length, 0);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(game.edits.length, 5);
  assert.equal(game.collector.ended, true);
  assert.ok(game.edits.every((payload) => payload.components.length === 5));
  assert.ok(game.replies.some((payload) => typeof payload === 'string' && payload.startsWith('You lost!')));
  assert.ok(!game.replies.some((payload) => typeof payload === 'string' && payload.startsWith('Congratulations!')));
});

test('Wordle does not consume a guess when dictionary lookup fails and accepts its own answer', async (t) => {
  const game = await startWordle(t, 'wordle-fetch-failure', 'apple', async () => ({ ok: false, status: 503 }));
  game.guess('crane');
  game.guess('APPle');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(game.edits.length, 1);
  assert.ok(game.replies.some((payload) => typeof payload === 'string' && payload.includes('dictionary is unavailable')));
  assert.equal(game.requests.length, 2, 'the actual answer should not require a dictionary lookup');
  assert.equal(game.collector.ended, true);
});

test('Wordle rejects malformed random-word responses and releases its session', async (t) => {
  const logger = require('../src/utils/logger');
  t.mock.method(logger, 'error', () => {});
  const game = await startWordle(t, 'wordle-invalid-answer', '<bad>');
  assert.match(game.replies[0], /could not start/);
  await require('../src/commands/fun/wordle').execute(game.message);
  assert.equal(game.requests.length, 2, 'a failed start should not keep the player locked');
  assert.equal(game.edits.length, 0);
});
