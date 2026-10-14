const config = require('./config');
const { createClient } = require('./client/Client');
const { connectDatabase, disconnectDatabase } = require('./database');
const { loadCommands } = require('./command/registry');
const { loadEvents } = require('./event/registry');
const { createPrefixHandler, createSlashHandler } = require('./command/dispatch');
const highlightModule = require('./events/messageCreate/highlight');
const lastPingModule = require('./events/messageCreate/lastping');
const settingsService = require('./database/services/settingsService');
const afkModel = require('./database/models/afk');
const cooldowns = require('./command/cooldowns');
const logger = require('./utils/logger');
const { cleanupTeamNames } = require('./utils/summerFight');
const { Events } = require('discord.js');

function validateEnvironment(env) {
  const missing = ['token', 'mongopath'].filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

function createShutdown(client) {
  let shutdownPromise;
  return () => {
    if (!shutdownPromise) {
      shutdownPromise = (async () => {
        client.state.shuttingDown = true;
        for (const timer of client.state.timers) clearTimeout(timer);
        client.state.timers.clear();
        cooldowns.clear();
        try {
          await client.destroy();
        } finally {
          await disconnectDatabase();
        }
      })();
    }
    return shutdownPromise;
  };
}

async function main() {
  require('dotenv').config();
  validateEnvironment(process.env);
  const client = createClient();
  const shutdown = createShutdown(client);

  const exit = (code) => {
    // A broken network connection must not hang process termination forever.
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    shutdown().then(() => process.exit(code), (error) => {
      logger.error('Shutdown failed', error);
      process.exit(1);
    });
  };
  process.once('SIGINT', () => exit(0));
  process.once('SIGTERM', () => exit(0));
  process.once('uncaughtException', (error) => {
    logger.error('Uncaught exception; shutting down', error);
    exit(1);
  });
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', reason));

  try {
    // Validate all modules before opening network connections.
    loadCommands(client);
    loadEvents(client);
    client.on(Events.MessageCreate, createPrefixHandler(client));
    client.on(Events.InteractionCreate, createSlashHandler(client));

    client.once(Events.ClientReady, () => {
      logger.info(`Client is online! Server count: ${client.guilds.cache.size}`);
      client.user.setPresence({ status: 'dnd' });
      client.emit('tick');
      client.emit('hourlyStats');

      if (client.shard) {
        void client.shard.broadcastEval(async (shardClient, { allowedGuildIds }) => {
          for (const guild of shardClient.guilds.cache.values()) {
            if (!allowedGuildIds.includes(guild.id) && guild.memberCount < 10) {
              await guild.leave();
            }
          }
        }, { context: { allowedGuildIds: [config.guildId, '856111404322258956'] } })
          .catch((error) => logger.error('Could not leave small guilds', error));
      }
    });

    await connectDatabase(process.env.mongopath);
    // Populate feature caches before login, so the first gateway message cannot
    // race the asynchronous ClientReady initialization.
    const [settings, afkUsers, cleanedTeamNames] = await Promise.all([
      settingsService.load(),
      afkModel.find().select('userId').lean(),
      cleanupTeamNames(),
      highlightModule.load(client),
      lastPingModule.load()
    ]);
    client.state.afkIgnore = settings.afkIgnore || [];
    client.state.afks = [...new Set(afkUsers.map((user) => user.userId))];
    if (cleanedTeamNames > 0) {
      logger.info(`Removed user mentions from ${cleanedTeamNames} team name(s)`);
    }
    await client.login(process.env.token);
    return client;
  } catch (error) {
    await shutdown().catch((shutdownError) => logger.error('Startup cleanup failed', shutdownError));
    throw error;
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal startup error', error);
    process.exit(1);
  });
}

module.exports = { main, validateEnvironment, createShutdown };