const { Message } = require('discord.js');
const Database = require('../database/lastping');
module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const allowedRoles = [
      '826002228828700718',
      '824539655134773269',
      '999911967319924817',
      '825283097830096908',
      '828048225096826890',
      '876460154705555487',
      '824687526396297226'
    ];
    if (
      !message?.guild ||
      message.guild.id !== '824294231447044197' ||
      message.author.bot
    ) {
      return;
    }

    if (message.mentions?.members?.filter((a) => !a.user.bot).size < 1) {
      return;
    }

    const mentions = message.mentions.members;
    for (const [key, member] of mentions) {
      if (!member.roles.cache.hasAny(...allowedRoles)) continue;
      const userId = member.id;
      if (!message.channel.permissionsFor(userId).has('ViewChannel')) return;
      const dbUser = await getUser(userId);
      dbUser.pings.push({
        pingerId: message.author.id,
        msg: {
          url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
          content: message.content,
          when: (message.createdTimestamp / 1000).toFixed(0)
        }
      });
      dbUser.save();
    }
  }
};

const getUser = async (userId) => {
  let u = await Database.findOne({ userId });
  if (!u) {
    u = new Database({
      userId,
      pings: []
    });
  }
  return u;
};
