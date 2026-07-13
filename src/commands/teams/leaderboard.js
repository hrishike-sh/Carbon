const TeamDB = require('../../database/models/teams');
const { infoEmbed } = require('../../utils/embeds');

function displayTeamName(name) {
  const cleaned = String(name || '')
    .replace(/<@[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[*_~`\s]+|[*_~`\s]+$/g, '')
    .trim();

  return cleaned || 'Unnamed Team';
}

module.exports = {
  name: 'teamleaderboard',
  aliases: ['eventleaderboard', 'tlb'],

  async execute(message, args, client) {
    const allTeams = await TeamDB.find({}).sort({ points: -1, name: 1 });

    const map = allTeams.map(
      (team, index) =>
        `${index + 1}. **${displayTeamName(team.name)}** — ${team.points} points`
    );

    return message.reply({
      embeds: [
        infoEmbed({
          title: 'Summer Fight Leaderboard',
          description: map.join('\n') || 'No teams yet.',
          timestamp: true
        })
      ],
      allowedMentions: { parse: [] }
    });
  }
};
