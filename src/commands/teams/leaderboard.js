const { Message, Client, Colors } = require('discord.js');
const TeamDB = require('../../database/teams');
module.exports = {
  name: 'teamleaderboard',
  aliases: ['eventleaderboard', 'tlb'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const allTeams = await TeamDB.find({});
    const map = allTeams.map((a) => {
      `**${a.name}**: ${a.points}`;
    });

    return message.reply({
      embeds: [
        {
          title: 'Team Leaderboard',
          description: map.join('\n'),
          color: Colors.DarkGreen,
          timestamp: new Date()
        }
      ]
    });
  }
};
