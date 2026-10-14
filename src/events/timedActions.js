const { Events, OverwriteType, RESTJSONErrorCodes } = require('discord.js');
const TimedAction = require('../database/models/timed');
const logger = require('../utils/logger');

const POLL_INTERVAL = 30_000;

async function processViewlockTimeout(client, action) {
  if (!action.data?.channelId || !action.data?.userId) {
    await action.deleteOne();
    return;
  }

  const channel = await client.channels.fetch(action.data.channelId).catch((error) => {
    if (error.code === RESTJSONErrorCodes.UnknownChannel) return null;
    throw error;
  });

  if (!channel?.permissionOverwrites) {
    await action.deleteOne();
    return;
  }

  await channel.permissionOverwrites.edit(
    action.data.userId,
    { ViewChannel: null },
    {
      type: OverwriteType.Member,
      reason: action.data.reason || 'Temporary viewlock expired'
    }
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
