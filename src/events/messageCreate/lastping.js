const config = require('../../config');
const Database = require('../../database/models/lastping');

module.exports = {
  name: 'lastping',

  async execute(message) {
    if (message.guild.id !== config.ids.guildId) return;

    const mentions = message.mentions?.members;
    if (!mentions || mentions.filter((a) => !a.user.bot).size < 1) return;

    for (const [, member] of mentions) {
      if (!member.roles.cache.hasAny(...config.roles.lastPingAllowed)) continue;
      if (!message.channel.permissionsFor(member.id).has('ViewChannel')) continue;

      const userId = member.id;
      let dbUser = await Database.findOne({ userId });
      if (!dbUser) {
        dbUser = new Database({ userId, pings: [] });
      }

      dbUser.pings.push({
        pingerId: message.author.id,
        msg: {
          url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
          content: message.content,
          when: (message.createdTimestamp / 1000).toFixed(0)
        }
      });
      await dbUser.save();
    }
  }
};
