const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const logger = require('../utils/logger');

function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Reaction, Partials.Message]
  });

  client.state = {
    commands: new Collection(),
    slashCommands: new Collection(),
    cooldowns: new Collection(),
    snipes: {
      snipes: new Collection(),
      esnipes: new Collection()
    },
    antiBot: {
      messageCounts: new Map(),
      processing: new Set()
    },
    afks: [],
    afkIgnore: [],
    highlights: null,
    lastHighlightPing: null,
    counts: {
      commandsRan: 0,
      messagesRead: 0,
      slashCommandsRan: 0,
      coinEventsTriggered: 0,
      heistsTriggered: 0,
      mathEventsTriggered: 0,
      activeUsers: new Set()
    }
  };

  client.on('error', (err) => {
    logger.error('Discord client error', err);
  });

  return client;
}

module.exports = { createClient };
