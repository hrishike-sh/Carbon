const { runEvent } = require('../../events/event2025');

module.exports = {
  name: 'events',

  async execute(message, args, client) {
    if (args[0] !== undefined && !/^[0-7]$/.test(args[0])) {
      return message.reply('Choose an event number from 0 to 7, or omit it for a random game.');
    }
    const index = args[0] === undefined ? undefined : Number(args[0]);
    // Manual games share the scheduler's implementation, with rewards disabled.
    return runEvent(client, message.channel, index);
  }
};
