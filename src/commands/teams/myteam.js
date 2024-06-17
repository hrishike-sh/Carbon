const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/teams');
module.exports = {
  name: 'myteam',
  aliases: ['team'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const userId = message.author.id;
    const team = await TeamDB.findOne({ users: userId });
    if (!team) return message.reply('You are not in a team.');

    return message.reply({
      embeds: [
        {
          author: {
            name: message.author.username,
            icon_url: message.author.displayAvatarURL()
          },
          title: team.name,
          description: `**Role:** <@&${team.roleId}>\n**Points:** ${
            team.points
          }\n**Members:** ${team.users.map((a) => `<@${a}>`).join(', ')}`,
          footer: {
            text: 'Check the event leaderboards with fh tlb'
          }
        }
      ]
    });
  }
};
