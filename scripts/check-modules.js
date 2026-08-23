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

console.log('Command and event modules loaded successfully.');
