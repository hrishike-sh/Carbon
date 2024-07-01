const { Message, Client, Colors } = require('discord.js');
const TeamDB = require('../../database/teams');
const arr = ['🥇', '🥈', '🥉'];
module.exports = {
  name: 'teamleaderboard',
  aliases: ['eventleaderboard', 'tlb'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const allTeams = await TeamDB.find({}).sort({ points: -1 });

    const map = allTeams.map(
      (a, ind) =>
        `${arr[ind] || '<:blank:914473340129906708>'} **${a.name}** : ${
          a.points
        }`
    );

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
