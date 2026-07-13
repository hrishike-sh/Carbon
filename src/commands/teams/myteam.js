const TeamDB = require('../../database/models/teams');
const { infoEmbed, errorEmbed } = require('../../utils/embeds');
const {
  ATTACKS_PER_WINDOW,
  SHIELDS_PER_DAY,
  ensureSummerFight,
  findTeamByName,
  resetAttackWindow,
  resetShieldUses
} = require('../../utils/summerFight');

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

    ensureSummerFight(team);
    resetAttackWindow(team);
    resetShieldUses(team);

    const lootboxes = userId && team.lootboxes
      ? (typeof team.lootboxes.get === 'function'
          ? team.lootboxes.get(userId)
          : team.lootboxes[userId]) || 0
      : null;
    const scoreLines = [
      `Points: ${team.points}`,
      `Lives: ${team.lives}`,
      `Attacks: ${team.summerFight.attacksUsed}/${ATTACKS_PER_WINDOW}`,
      `Shields: ${team.summerFight.shieldUses}/${SHIELDS_PER_DAY}`
    ];
    if (lootboxes !== null) scoreLines.push(`Loot Boxes: ${lootboxes}`);

    return message.reply({
      embeds: [
        infoEmbed({
          title: team.name,
          fields: [
            {
              name: 'Score',
              value: scoreLines.join('\n'),
              inline: true
            },
            {
              name: 'Members',
              value: team.users.map((a) => `<@${a}>`).join(' '),
              inline: true
            }
          ],
          timestamp: true
        })
      ]
    });
  }
};
