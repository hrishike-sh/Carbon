const config = require('../../config');
const logger = require('../../utils/logger');
const settingsService = require('../../database/services/settingsService');

const handlers = [
  { name: 'highlight', execute: require('./highlight').execute },
  { name: 'autoreact', execute: require('./autoreact').execute },
  { name: 'afk', execute: require('./afk').execute },
  { name: 'coins', execute: require('./coins').execute },
  { name: 'coinevents', execute: require('./coinevents').execute },
  { name: 'calc', execute: require('./calc').execute },
  { name: 'carlModlogs', execute: require('./carlModlogs').execute, acceptsBotMessages: true },
  { name: 'lastping', execute: require('./lastping').execute },
  { name: 'mafia', execute: require('./mafia').execute, acceptsBotMessages: true },
  { name: 'presents', execute: require('./presents').execute },
  { name: 'tot', execute: require('./tot').execute }
];

module.exports = {
  name: 'messageCreate',
  handlers,

  async execute(message, client) {
    if (!message.guild) return;

    for (const handler of handlers) {
      if (message.author?.bot && !handler.acceptsBotMessages) continue;

      try {
        await handler.execute(message, client);
      } catch (err) {
        logger.error(`messageCreate handler "${handler.name}" error`, err);
      }
    }
  },

  async load(client) {
    const settings = await settingsService.load();
    client.state.afkIgnore = settings.afkIgnore || [];
    await require('./highlight').load(client);
  }
};
