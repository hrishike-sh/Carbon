const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Collection } = require('discord.js');
const { loadCommands } = require('../src/command/registry');
const { loadEvents } = require('../src/event/registry');
const { resetTeams } = require('../scripts/reset-teams');

test('retired commands and every alias are absent, while general team commands remain', () => {
  const client = { state: { commands: new Collection(), slashCommands: new Collection() } };
  loadCommands(client);
  const commands = client.state.commands;
  for (const file of ['attack', 'block', 'shield', 'luckybox', 'lootbox-add']) {
    const command = require(`../src/commands/teams/${file}`);
    for (const name of [command.name, ...command.aliases]) assert.equal(commands.has(name), false, name);
  }
  for (const name of ['tlb', 'myteam', 'teams', 'createteam', 'events']) assert.ok(commands.has(name), name);
});

test('retired seasonal scheduler is never registered', (t) => {
  const seasonal = require('../src/events/event2025');
  const execute = t.mock.method(seasonal, 'execute', () => { throw new Error('Retired event ran'); });
  const client = new EventEmitter();
  loadEvents(client);
  client.emit('tick');
  assert.equal(execute.mock.callCount(), 0);
  assert.equal(client.listenerCount('tick'), 0);
});

test('team reset previews without writes and deletes only backed-up IDs', async () => {
  const teams = [{ _id: 'old-team', name: 'Old Team', points: 829 }];
  const operations = [];
  const collection = {
    find: () => ({ toArray: async () => teams }),
    deleteMany: async (filter) => { operations.push(['delete', filter]); return { deletedCount: 1 }; }
  };
  const backup = async (documents) => { operations.push(['backup', documents]); };
  assert.deepEqual(await resetTeams(collection, { backup }), { found: 1, deleted: 0 });
  assert.deepEqual(operations, []);
  assert.deepEqual(await resetTeams(collection, { apply: true, backup }), { found: 1, deleted: 1 });
  assert.deepEqual(operations, [
    ['backup', teams], ['delete', { _id: { $in: ['old-team'] } }]
  ]);
});

test('failed backup prevents deletion', async () => {
  const collection = {
    find: () => ({ toArray: async () => [{ _id: 'old-team' }] }),
    deleteMany: async () => assert.fail('Must not delete without a backup')
  };
  await assert.rejects(resetTeams(collection, {
    apply: true,
    backup: async () => { throw new Error('Disk full'); }
  }), /Disk full/);
});
