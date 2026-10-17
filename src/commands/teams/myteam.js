const TeamDB = require('../../database/models/teams');
const { infoEmbed, errorEmbed } = require('../../utils/embeds');
const { findTeamByName } = require('../../utils/summerFight');

module.exports = {
  name: 'myteam',
  aliases: ['team'],

  async execute(message, args, client) {
    const mentionedUserId = message.mentions?.users?.first()?.id;
    const teamName = mentionedUserId ? '' : args.join(' ').trim();
    const userId = mentionedUserId || (!teamName ? message.author.id : null);
    const team = teamName
      ? await findTeamByName(teamName)
      : await TeamDB.findOne({ users: userId });

    if (!team) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: teamName ? 'That team does not exist.' : 'That user is not in a team.'
          })
        ]
      });
    }

    return message.reply({
      embeds: [
        infoEmbed({
          title: team.name,
          fields: [
            {
              name: 'Score',
              value: `Points: ${team.points}`,
              inline: true
            },
            {
              name: 'Members',
              value: team.users.map((a) => `<@${a}>`).join(' ') || 'No members.',
              inline: true
            }
          ],
          timestamp: true
        })
      ]
    });
  }
};
