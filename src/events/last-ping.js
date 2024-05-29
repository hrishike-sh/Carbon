const { Message } = require('discord.js');
const Database = require('../database/lastping');
module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const client = message.client;
    const allowedRoles = ['826002228828700718'];
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
          content: message.content
        }
      });
      dbUser.save();
    }
  }
};

const getUser = async (userId) => {
  let u = await Database.findOne({ userId });
  if (u) {
    u = new Database({
      userId,
      pings: []
    });
  }
  return u;
};
