const { Message, Client } = require('discord.js');
const DATABASE = require('../../database/models/afk');
const SERVER = require('../../database/models/settingsSchema');
const config = require('../../config');
module.exports = {
  name: 'afkset',
  cooldown: 3,
  roles: [config.roles.staff.mod, config.roles.staff.admin],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   * @returns
   */
  async execute(message, args, client) {
    // fh afkset clear @user/user_id
    const eg = `**How to use this command:**\n\n> fh afkset clear user_id/@user\nRemoves AFK from user_id\n\n> fh afkset ignore\nIgnores the current channel from AFK removal.`;
    const action = args.shift();
    if (!action) {
      return message.reply(eg);
    }

    if (action.toLowerCase() == 'clear') {
      let userId = args.shift();
      if (!userId) return message.reply(eg);

      userId = userId.replace(/[^0-9]/g, '');
      const dbEntry = await DATABASE.findOne({
        userId
      });
      if (!dbEntry) return message.reply(`User ID: ${userId} is not AFK!`);

      await DATABASE.deleteOne({ userId });
      client.state.afks = client.state.afks.filter((a) => a !== userId);
      return message.reply(`<@${userId}> should no longer be AFK.`);
    } else if (action.toLowerCase() == 'ignore') {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply(
          'You need to be an Admin to use this sub-command.'
        );
      }
      let server = await SERVER.findOne({
        guildID: message.guild.id
      });

      if (!server) {
        server = new SERVER({
          guildID: message.guild.id,
          afkIgnore: []
        });
      }
      const channel = message.channel;
      if (server.afkIgnore.includes(channel.id)) {
        server.afkIgnore = server.afkIgnore.filter((a) => a !== channel.id);
        client.state.afkIgnore = client.state.afkIgnore.filter(
          (a) => a !== channel.id
        );
        await server.save();
        return message.reply(`${channel.toString()} is no longer AFK Ignored.`);
      } else {
        if (server.afkIgnore) {
          server.afkIgnore.push(channel.id);
        } else {
          server.afkIgnore = [channel.id];
        }
        client.state.afkIgnore.push(channel.id);
        await server.save();

        return message.reply(`${channel.toString()} is now AFK Ignored!`);
      }
    } else return message.reply(eg);
  }
};
