const Database = require('../../database/models/grinder_dono');
const config = require('../../config');
const { neutralEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'grinderslist',
  aliases: ['glist'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.staff.cman)) return;
    const all = await Database.find({
      'dynamic.grinder': true
    });
    const list = all.sort((a, b) => a.dynamic.expires - b.dynamic.expires);
    const map = [];
    for (let i = 0; i < list.length; i++) {
      const user =
        (await client.users.fetch(list[i].userID).catch(() => null)) ||
        list[i].userID;
      const time = `<t:${(list[i].dynamic.expires / 1000).toFixed(0)}:R>`;

      map.push(`**${(i + 1).toString().padStart(2, 0)}.** ${user} - ${time}`);
    }
    return message.reply({
      embeds: [
        neutralEmbed({ description: map.join('\n') })
      ]
    });
  }
};
