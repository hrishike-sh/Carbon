const {
  SCORE,
  findTeamByUser,
  hasPendingAttack,
  resolveExpiredAttack,
  blockPendingAttack
} = require('../../utils/summerFight');

module.exports = {
  name: 'block',
  aliases: ['defend'],
  cooldown: 3,

  async execute(message, args, client) {
    const team = await findTeamByUser(message.author.id);
    if (!team) return message.reply('You are not in a team.');

    const expired = await resolveExpiredAttack(team, message.channel);
    if (expired || !hasPendingAttack(team)) {
      return message.reply('Your team is not currently under attack.');
    }

    const result = await blockPendingAttack(team, 'manual');
    if (!result) return message.reply('Your team is not currently under attack.');

    return message.channel.send(
      `**${team.name}** blocked **${result.attackerName}**'s attack! ` +
        `**${team.name}** gained ${SCORE.MANUAL_BLOCK} points and **${result.attackerName}** lost ${Math.abs(SCORE.FAILED_ATTACK)} points.`
    );
  }
};
