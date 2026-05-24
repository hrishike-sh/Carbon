const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/models/teams');
const config = require('../../config');
module.exports = {
  name: 'removemember',
  aliases: ['teamremove', 'tr'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.cman,
        config.roles.staff.admin,
        '1163857079300276254'
      )
    ) {
      return;
    }

    const member =
      message.mentions.members?.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('Mention the member dumbfuck.');
    const team = await TeamDB.findOne({ users: member.id });
    if (!team) return message.reply('The member is not in a team.');

    team.users = team.users.filter((a) => a !== member.id);
    team.save();
    message.reply(
      `Removed member **${member.user.tag}** from the **${team.name}** team.`
    );
  }
};
