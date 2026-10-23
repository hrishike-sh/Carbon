const { EventEmitter } = require('node:events');
const { Collection } = require('discord.js');
const { loadCommands } = require('../src/command/registry');
const { loadEvents } = require('../src/event/registry');

const client = new EventEmitter();
client.state = {
  commands: new Collection(),
  slashCommands: new Collection()
};

loadCommands(client);
loadEvents(client);

if (client.state.commands.size === 0) {
  throw new Error('No prefix commands loaded');
}
if (client.state.slashCommands.size === 0) {
  throw new Error('No slash commands loaded');
}

for (const file of ['attack', 'block', 'shield', 'luckybox', 'lootbox-add']) {
  const retired = require(`../src/commands/teams/${file}`);
  for (const name of [retired.name, ...(retired.aliases || [])]) {
    if (client.state.commands.has(name)) {
      throw new Error(`Retired event command is still registered: ${name}`);
    }
  }
}
if (client.listenerCount('tick') !== 0) {
  throw new Error('Retired seasonal scheduler is still registered');
}
if (!client.state.commands.has('tlb')) {
  throw new Error('Team leaderboard is not registered');
}

console.log('Command and event modules loaded successfully.');
