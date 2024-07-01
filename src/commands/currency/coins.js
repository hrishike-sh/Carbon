const { Message, Client } = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'coins',
  aliases: ['coin', 'bal', 'balance', 'cash'],
  description: 'Check your coin balance.',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const user =
      message.mentions.members?.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;
    return message.reply({
      embeds: [
        {
          author: {
            icon_url: user.user.displayAvatarURL(),
            name: user.user.username
          },
          timestamp: new Date(),
          description:
            '**Balance:** <:token:1003272629286883450> ' +
              (await getUser(user.id)).coins.toLocaleString().split('.')[0] || 0
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
