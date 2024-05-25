const { Message, Client } = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'coins',
  aliases: ['coin'],
  description: 'Check your coin balance.',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const userId = message.author.id;
    return message.reply({
      embeds: [
        {
          author: {
            icon_url: message.author.displayAvatarURL(),
            name: message.author.username
          },
          timestamp: new Date(),
          description:
            '**Balance:** <:token:1003272629286883450>' +
              (await getUser(userId)).coins.toLocaleString() || 0
        }
      ]
    });
  }
};

const getUser = async (userId) => {
  let dbu = await Database.findOne({
    userId
  });
  if (!dbu) {
    dbu = new Database({
      userId,
      coins: 0
    });
  }
  return dbu;
};
