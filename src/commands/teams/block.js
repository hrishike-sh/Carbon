const {
  SCORE,
  displayTeamName,
  findTeamByUser,
  resetLives,
  hasPendingAttack,
  resolveExpiredAttack,
  blockPendingAttack
} = require('../../utils/summerFight');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'block',
  aliases: ['defend'],
  cooldown: 3,

  async execute(message, args, client) {
    const team = await findTeamByUser(message.author.id);
    if (!team) return message.reply({ embeds: [errorEmbed({ description: 'You are not in a team.' })] });
    resetLives(team);
    if ((team.lives ?? 5) <= 0) {
      return message.reply({
        embeds: [errorEmbed({ title: 'Defend unavailable', description: 'Your team has no lives left.' })]
      });
    }

    const expired = await resolveExpiredAttack(team, message.channel);
    if (expired || !hasPendingAttack(team)) {
      return message.reply({
        embeds: [errorEmbed({ title: 'Nothing to block', description: 'Your team is not currently under attack.' })]
      });
    }

    const result = await blockPendingAttack(team, 'manual');
    if (!result) {
      return message.reply({
        embeds: [errorEmbed({ title: 'Nothing to block', description: 'Your team is not currently under attack.' })]
      });
    }
    const teamName = displayTeamName(team);

    return message.channel.send({
      embeds: [
        successEmbed({
          title: 'Attack blocked!',
          description: `**${teamName}** successfully defended against **${result.attackerName}**.`,
          fields: [
            { name: `${teamName} earned`, value: `+${SCORE.MANUAL_BLOCK} points`, inline: true },
            { name: `${result.attackerName} lost`, value: `${Math.abs(SCORE.FAILED_ATTACK)} points`, inline: true }
          ],
          footer: 'Summer Fight',
          timestamp: true
        })
      ]
    });
  }
};
