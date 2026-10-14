const { Events } = require('discord.js');
const TimedAction = require('../database/models/timed');
const logger = require('../utils/logger');
const { startInterval } = require('../utils/asyncEvents');

const POLL_INTERVAL = 30_000;

async function processViewlockTimeout(client, action) {
  if (!action.data?.channelId || !action.data?.userId) {
    await action.deleteOne();
    return;
  }

  const channel = await client.channels.fetch(action.data.channelId).catch((error) => {
    // Only a deleted channel is final. Permission/network errors must retry.
    if (error.code === 10003) return null;
    throw error;
  });

  if (!channel?.permissionOverwrites || !action.data?.userId) {
    await action.deleteOne();
    return;
  }

  await channel.permissionOverwrites.edit(
    action.data.userId,
    { ViewChannel: null },
    { type: 1, reason: action.data.reason || 'Temporary viewlock expired' }
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
    try {
      await processDueActions(client);
    } catch (error) {
      logger.error('Failed to poll timed actions', error);
    }
    startInterval(client, () => processDueActions(client), POLL_INTERVAL, 'Timed action poll');
  }
};
