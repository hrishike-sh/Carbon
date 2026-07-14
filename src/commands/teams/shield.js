const {
  SHIELD_DURATION_MS,
  SHIELDS_PER_DAY,
  SCORE,
  displayTeamName,
  findTeamByUser,
  nextDayTimestamp,
  resetShieldUses,
  isShieldActive,
  hasPendingAttack,
  resolveExpiredAttack,
  blockPendingAttack
} = require('../../utils/summerFight');
const { successEmbed, warningEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'shield',
  aliases: ['protect'],
  cooldown: 5,

  async execute(message, args, client) {
    const team = await findTeamByUser(message.author.id);
    if (!team) return message.reply({ embeds: [errorEmbed({ description: 'You are not in a team.' })] });
    const teamName = displayTeamName(team);

    await resolveExpiredAttack(team, message.channel);
    resetShieldUses(team);

    if (isShieldActive(team)) {
      const endsAt = Math.floor(new Date(team.summerFight.shieldExpiresAt).getTime() / 1000);
      return message.reply({
        embeds: [warningEmbed({ title: 'Shield already active', description: `Your team's shield remains active until <t:${endsAt}:R>.` })]
      });
    }

    if (team.summerFight.shieldUses >= SHIELDS_PER_DAY) {
      return message.reply({
        embeds: [
          warningEmbed({
            title: 'Shield limit reached',
            description: `Your team has used all **${SHIELDS_PER_DAY}** shields today. They reset <t:${nextDayTimestamp()}:R>.`
          })
        ]
      });
    }

    team.summerFight.shieldUses += 1;
    team.summerFight.shieldExpiresAt = new Date(Date.now() + SHIELD_DURATION_MS);
    team.summerFight.stats.shieldsUsed =
      (team.summerFight.stats.shieldsUsed || 0) + 1;

    const shieldEnds = Math.floor(new Date(team.summerFight.shieldExpiresAt).getTime() / 1000);

    if (hasPendingAttack(team)) {
      const result = await blockPendingAttack(team, 'shield');
      return message.channel.send({
        embeds: [
          successEmbed({
            title: 'Shield activated — attack blocked!',
            description: `**${teamName}**'s shield stopped **${result.attackerName}**'s attack.`,
            fields: [
              { name: 'Shield expires', value: `<t:${shieldEnds}:R>`, inline: true },
              { name: `${teamName} earned`, value: `+${SCORE.SHIELD_BLOCK} points`, inline: true },
              { name: `${result.attackerName} lost`, value: `${Math.abs(SCORE.FAILED_ATTACK)} points`, inline: true }
            ],
            footer: 'Summer Fight',
            timestamp: true
          })
        ]
      });
    }

    await team.save();
    return message.channel.send({
      embeds: [
        successEmbed({
          title: 'Shield activated!',
          description: `**${teamName}** is protected from incoming attacks.`,
          fields: [{ name: 'Protection ends', value: `<t:${shieldEnds}:R>`, inline: true }],
          footer: 'Summer Fight',
          timestamp: true
        })
      ]
    });
  }
};
