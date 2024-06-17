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

    const role =
      message.mentions.roles?.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply('Mention the role dumbfuck.');

    args.shift();
    const member =
      message.mentions.members?.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('Mention the member dumbfuck.');
    const team = await TeamDB.findOne({ roleId: role.id });
    if (!team)
      return message.reply('The team does not exist! Create it first.');

    if (!team.users.includes(member.id))
      return message.reply('The member is not in the team.');

    team.users = team.users.filter((a) => a !== member.id);
    team.save();
    message.reply(
      `Removed member **${member.user.tag}** from the **${team.name}** team.`
    );
  }
};
