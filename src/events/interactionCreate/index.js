const handlers = [require('./proleRoles')];
const logger = require('../../utils/logger');

module.exports = {
  name: 'interactionCreate',
  handlers,

  async execute(interaction, client) {
    for (const handler of handlers) {
      try {
        await handler.execute(interaction, client);
      } catch (err) {
        logger.error(`Interaction handler "${handler.name}" failed`, err);
      }
    }
  }
};
