const handlers = [require('./proleRoles')];

module.exports = {
  name: 'interactionCreate',
  handlers,

  async execute(interaction, client) {
    for (const handler of handlers) {
      try {
        await handler.execute(interaction, client);
      } catch (err) {
        // silently continue
      }
    }
  }
};
