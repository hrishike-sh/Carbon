const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/teams');

module.exports = {
  name: 'points-add',
  aliases: ['padd'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (
      !message.member.roles.cache.hasAny(
        '1016728636365209631',
        '824348974449819658',
        '1163857079300276254'
      )
    ) {
      return;
    }

    const t = args.shift();
    const user =
      message.mentions.members.first()?.id ||
      message.guild.members.cache.get(t)?.id;
    const points = args.shift();

    if (!user || !points) {
      return message.reply('That is NOT how you use this command!');
    }

    if (isNaN(points)) {
      return message.reply('That is NOT how you use this command!');
    }

    await TeamDB.updateOne(
      {
        users: user
      },
      {
        $inc: {
          points: parseInt(points)
        }
      }
    );
  }
};
