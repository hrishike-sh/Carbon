const { Message, Client, Colors } = require('discord.js');
const Database = require('../../database/grinder_dono');
module.exports = {
  name: 'grinderremind',
  aliases: ['gremind'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1016728636365209631')) return;
    const list = await Database.find({
      'dynamic.grinder': true,
      'dynamic.expires': {
        $lt: new Date().getTime()
      }
    });

    for (let i = 0; i < list.length; i++) {
      const db = list[i];
      const user = await client.users.fetch(db.userID);
      if (!user) continue;

      await client.channels.cache.get('839800222677729310').send({
        embeds: [
          {
            title: 'Grinder Reminder ⚠',
            description: `Your grinder payment has been pending for **<t:${(
              db.dynamic.expires / 1000
            ).toFixed(
              0
            )}:R>**!\n\nPlease ping <@738797748026867822> to make your payment!`,
            color: Colors.Red,
            timestamp: new Date()
          }
        ],
        content: `<@${user.id}>`
      });
    }
  }
};
