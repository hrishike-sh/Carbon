const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/models/teams');
const config = require('../../config');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
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
    if (!member) return message.reply({ embeds: [errorEmbed({ description: 'Mention the user to add.' })] });

    const teamName = args.slice(1).join(' ');
    if (!teamName) return message.reply({ embeds: [errorEmbed({ description: 'Provide the team name.' })] });

    const team = await TeamDB.findOne({ name: teamName });
    if (!team)
      return message.reply({ embeds: [errorEmbed({ description: 'That team does not exist. Create it first.' })] });

    const existingTeam = await TeamDB.findOne({ users: member.id });
    if (existingTeam)
      return message.reply({
        embeds: [errorEmbed({ description: `That member is already in **${existingTeam.name}**.` })]
      });

    if (team.users.includes(member.id))
      return message.reply({ embeds: [errorEmbed({ description: 'That member is already in this team.' })] });

    team.users.push(member.id);
    team.save();
    return message.reply({
      embeds: [
        successEmbed({
          title: 'Team member added',
          description: `**${member.user.tag}** joined **${team.name}**.`
        })
      ]
    });
  }
};
