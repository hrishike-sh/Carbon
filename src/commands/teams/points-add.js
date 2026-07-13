const TeamDB = require('../../database/models/teams');
const config = require('../../config');
const { findTeamByName } = require('../../utils/summerFight');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

function canManageEvent(message) {
  return (
    message.author.id === config.roles.staff.owner ||
    message.member.roles.cache.hasAny(
      config.roles.staff.cman,
      config.roles.staff.admin,
      '1163857079300276254'
    )
  );
}

function parseUserId(value) {
  const match = String(value || '').match(/^<@!?(\d{17,20})>$/) ||
    String(value || '').match(/^(\d{17,20})$/);
  return match ? match[1] : null;
}

module.exports = {
  name: 'points',
  aliases: ['points-add', 'padd', 'teampoints'],

  async execute(message, args) {
    if (!canManageEvent(message)) return;

    let team;
    let amount;
    const userId = message.mentions.users.first()?.id || parseUserId(args[0]);

    if (userId) {
      amount = Number(args[1]);
      team = await TeamDB.findOne({ users: userId });
    } else {
      amount = Number(args[0]);
      team = await findTeamByName(args.slice(1).join(' '));
    }

    if (!Number.isSafeInteger(amount) || amount === 0) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Invalid amount',
            description:
              'Use `fh points +5 Team Name`, `fh points -5 Team Name`, or `fh points @member -5`.'
          })
        ]
      });
    }

    if (!team) {
      return message.reply({ embeds: [errorEmbed({ description: 'That team does not exist.' })] });
    }

    team.points = (team.points || 0) + amount;
    await team.save();

    const action = amount > 0 ? 'Added' : 'Removed';
    return message.reply({
      embeds: [
        successEmbed({
          title: 'Team points updated',
          description:
            `${action} **${Math.abs(amount)} points** ${amount > 0 ? 'to' : 'from'} **${team.name}**.\n` +
            `New total: **${team.points} points**.`
        })
      ]
    });
  }
};
