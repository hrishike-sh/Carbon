const { Message, Client } = require('discord.js');
const Database = require('../../database/grinder_dono');
module.exports = {
  name: 'grinderday',
  aliases: ['gday'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1016728636365209631')) return;
    const user =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0]);
    if (!user) return message.reply('Please mention a user!');

    let db = await Database.findOne({
      userID: user.id
    });
    if (!db || !db.dynamic.grinder) {
      return message.reply(
        'This user is not a grinder. Add them to the grinders list first!'
      );
    }

    args.shift();
    const days = args[0];
    if (!days) return message.reply('Please specify the amount of days!');

    db.dynamic.expires += Number(days) * 86400000;
    db.save();

    message.reply(
      `Added **${days}** days to **${
        user.user.tag
      }**\n\nTheir grinder now expires in <t:${db.dynamic.expires / 1000}:R>`
    );
  }
};
