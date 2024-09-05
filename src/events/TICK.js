const { Client, TextChannel } = require('discord.js');
const TimedDatabase = require('../database/timed');
module.exports = {
  name: 'tick',
  /**
   *
   * @param {Client} client
   */
  async execute(action, client) {
    /**
     * Viewlocks
     */

    if (action == 'viewlocks' || action == '*') {
      const locks = await TimedDatabase.find({
        when: {
          $lt: new Date().getTime()
        }
      });

      if (!locks.length) return;

      for (const lock of locks) {
        await TimedDatabase.findOneAndDelete({
          _id: lock._id
        });

        const channel = client.channels.cache.get(lock.data.channelId);

        if (channel) {
          await channel.permissionOverwrites.edit(lock.data.userId, {
            ViewChannel: null
          });
        }

        // TODO: add logging here
        client.log({
          title: `[Viewlock] - Expired`,
          fields: [
            {
              name: 'User',
              value: `<@${lock.data.userId}>`,
              inline: true
            },
            {
              name: 'Channel',
              value: `<#${lock.data.channelId}>`,
              inline: true
            }
          ]
        });
        LogginChannel.send({
          embeds: [
            {
              title: '[VIEWLOCK] Expired',
              fields: [
                {
                  name: 'User',
                  value: `<@${lock.data.userId}>`,
                  inline: true
                },
                {
                  name: 'Channel',
                  value: `<#${lock.data.channelId}>`,
                  inline: true
                }
              ],
              timestamp: new Date(),
              color: '#ff0000'
            }
          ]
        });
        //
      }

      setTimeout(() => {
        client.emit('tick', 'viewlocks');
      }, 60 * 1000);
    }
  }
};
