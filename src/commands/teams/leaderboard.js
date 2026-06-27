const TeamDB = require('../../database/models/teams');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'teamleaderboard',
  aliases: ['eventleaderboard', 'tlb'],

  async execute(message, args, client) {
    const allTeams = await TeamDB.find({}).sort({ points: -1, lives: -1 });

    const map = allTeams.map(
      (team, index) =>
        `${index + 1}. **${team.name}** : ${team.points} points, ${team.lives ?? 5} lives`
    );

    return message.reply({
      embeds: [
        infoEmbed({
          title: 'Summer Fight Leaderboard',
          description: map.join('\n') || 'No teams yet.',
          timestamp: true
        })
      ]
    });
  }
};
