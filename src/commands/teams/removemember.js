const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/teams');
module.exports = {
  name: 'removemember',
  aliases: ['teamremove', 'tr'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (message.author.id !== '598918643727990784') return;

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
