const { Client } = require('discord.js');
const TimedDatabase = require('../database/timed');
module.exports = {
  name: 'tick',
  /**
   *
   * @param {Client} client
   */
  async execute(client) {
    /**
     * Viewlocks
     */

    const viewlocks = await TimedDatabase.find({
      what: 'viewlock',
      time: { $lt: Date.now() }
    });
    if (!viewlocks.length) return;

    for (const viewlock of viewlocks) {
      const data = viewlock.data;
      const channel = client.channels.cache.get(data.channelId);
      await channel.permissionOverwrites.delete(
        data.userId,
        'Timed viewlock expired.'
      );
    }
  }
};
