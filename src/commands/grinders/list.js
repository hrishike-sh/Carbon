const { Message, Client } = require('discord.js');
const Database = require('../../database/grinder_dono');
module.exports = {
  name: 'grinderslist',
  aliases: ['glist'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1016728636365209631')) return;
    const all = await Database.find({
      'dynamic.grinder': true
    });
    const map = all
      .sort((a, b) => a.dynamic.expires - b.dynamic.expires)
      .map(async (a) => {
        const user =
          (await client.users.fetch(a.userID).catch(() => null)).tag ||
          a.userID;
        const time = `<t:${(a.dynamic.expires / 1000).toFixed(0)}:R>`;

        return `- ${user} expires ${time}`;
      });
    return message.reply({
      embeds: [
        {
          description: map.join('\n')
        }
      ]
    });
  }
};
const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 5) {
    chunks.push(array.slice(i, i + 5));
  }
  return chunks;
};
