const TeamDB = require('../../database/models/teams');
const { infoEmbed, errorEmbed } = require('../../utils/embeds');
const {
  ATTACKS_PER_WINDOW,
  SHIELDS_PER_DAY,
  ensureSummerFight,
  resetAttackWindow,
  resetShieldUses
} = require('../../utils/summerFight');

module.exports = {
  name: 'myteam',
  aliases: ['team'],

  async execute(message, args, client) {
    const userId = message.mentions?.users?.first()?.id || message.author.id;
    const team = await TeamDB.findOne({ users: userId });
    if (!team) return message.reply({ embeds: [errorEmbed({ description: 'You are not in a team.' })] });

    ensureSummerFight(team);
    resetAttackWindow(team);
    resetShieldUses(team);

    const shieldExpiresAt = team.summerFight.shieldExpiresAt
      ? new Date(team.summerFight.shieldExpiresAt).getTime()
      : 0;
    const shieldStatus =
      shieldExpiresAt > Date.now()
        ? `Active until <t:${Math.floor(shieldExpiresAt / 1000)}:R>`
        : 'Inactive';
    const immunityExpiresAt = team.summerFight.immunityExpiresAt
      ? new Date(team.summerFight.immunityExpiresAt).getTime()
      : 0;
    const immunityStatus =
      immunityExpiresAt > Date.now()
        ? `Active until <t:${Math.floor(immunityExpiresAt / 1000)}:R>`
        : 'Inactive';
    const lootboxes = team.lootboxes
      ? (typeof team.lootboxes.get === 'function'
          ? team.lootboxes.get(userId)
          : team.lootboxes[userId]) || 0
      : 0;

    return message.reply({
      embeds: [
        infoEmbed({
          title: team.name,
          fields: [
            {
              name: 'Score',
              value:
                `Points: ${team.points}\n` +
                `Lives: ${team.lives}\n` +
                `Attacks: ${team.summerFight.attacksUsed}/${ATTACKS_PER_WINDOW}\n` +
                `Shields: ${team.summerFight.shieldUses}/${SHIELDS_PER_DAY}\n` +
                `Loot Boxes: ${lootboxes}`,
              inline: true
            },
            {
              name: 'Shield',
              value: shieldStatus,
              inline: true
            },
            {
              name: 'Immunity',
              value: immunityStatus,
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
