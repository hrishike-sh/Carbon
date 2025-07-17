const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/teams');
module.exports = {
  name: 'ta',
  aliases: ['teamadd'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
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

    const member =
      message.mentions.members?.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('Mention the user dumbfuck.');

    const teamName = args.slice(1).join(' ');
    if (!teamName) return message.reply('Provide the team name.');

    const team = await TeamDB.findOne({ name: teamName });
    if (!team)
      return message.reply('The team does not exist! Create it first.');

    if (team.users.includes(member.id))
      return message.reply('The member is already in the team.');

    team.users.push(member.id);
    team.save();
    message.reply(
      `Member **${member.user.tag}** added to the **${team.name}** team`
    );
  }
};
