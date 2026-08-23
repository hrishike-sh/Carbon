const { Events } = require('discord.js');
const TimedAction = require('../database/models/timed');
const logger = require('../utils/logger');

const POLL_INTERVAL = 30_000;

async function processViewlockTimeout(client, action) {
  const channel = await client.channels.fetch(action.data?.channelId).catch(() => null);

  if (!channel?.permissionOverwrites || !action.data?.userId) {
    await action.deleteOne();
    return;
  }

  await channel.permissionOverwrites.edit(
    action.data.userId,
    { ViewChannel: null },
    { reason: action.data.reason || 'Temporary viewlock expired' }
  );
  await action.deleteOne();
}

async function processDueActions(client) {
  const actions = await TimedAction.find({
    what: 'viewlock_timeout',
    when: { $lte: Date.now() }
  });

  for (const action of actions) {
    try {
      await processViewlockTimeout(client, action);
    } catch (error) {
      logger.error(`Failed to process timed action ${action.id}`, error);
    }
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    await processDueActions(client);

    const interval = setInterval(() => {
      processDueActions(client).catch((error) => {
        logger.error('Failed to poll timed actions', error);
      });
    }, POLL_INTERVAL);
    interval.unref();
  }
};
