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

      await Database.findOneAndUpdate(
        { userId: member.id },
        {
          $push: {
            pings: {
              pingerId: message.author.id,
              msg: {
                url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
                content: message.content,
                when: (message.createdTimestamp / 1000).toFixed(0)
              }
            }
          }
        },
        { upsert: true, new: true }
      );
    }
  }
};
