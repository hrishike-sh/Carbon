const {
  SHIELD_DURATION_MS,
  SHIELDS_PER_DAY,
  SCORE,
  findTeamByUser,
  nextDayTimestamp,
  resetShieldUses,
  isShieldActive,
  hasPendingAttack,
  resolveExpiredAttack,
  blockPendingAttack
} = require('../../utils/summerFight');

module.exports = {
  name: 'shield',
  aliases: ['protect'],
  cooldown: 5,

  async execute(message, args, client) {
    const team = await findTeamByUser(message.author.id);
    if (!team) return message.reply('You are not in a team.');

    await resolveExpiredAttack(team, message.channel);
    resetShieldUses(team);

    if (isShieldActive(team)) {
      const endsAt = Math.floor(new Date(team.summerFight.shieldExpiresAt).getTime() / 1000);
      return message.reply(`Your team's shield is already active until <t:${endsAt}:R>.`);
    }

    if (team.summerFight.shieldUses >= SHIELDS_PER_DAY) {
      return message.reply(
        `Your team has used both shields today. Shields reset <t:${nextDayTimestamp()}:R>.`
      );
    }

    team.summerFight.shieldUses += 1;
    team.summerFight.shieldExpiresAt = new Date(Date.now() + SHIELD_DURATION_MS);
    team.summerFight.stats.shieldsUsed =
      (team.summerFight.stats.shieldsUsed || 0) + 1;

    const shieldEnds = Math.floor(new Date(team.summerFight.shieldExpiresAt).getTime() / 1000);

    if (hasPendingAttack(team)) {
      const result = await blockPendingAttack(team, 'shield');
      return message.channel.send(
        `**${team.name}** activated a 30 minute shield and auto-blocked **${result.attackerName}**'s attack! ` +
          `Shield ends <t:${shieldEnds}:R>. **${team.name}** gained ${SCORE.SHIELD_BLOCK} points and **${result.attackerName}** lost ${Math.abs(SCORE.FAILED_ATTACK)} points.`
      );
    }

    await team.save();
    return message.channel.send(
      `**${team.name}** activated a 30 minute shield. It will auto-block attacks until <t:${shieldEnds}:R>.`
    );
  }
};
