const TeamDB = require('../../database/models/teams');
const config = require('../../config');
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

function parseUserId(message, value) {
  const mentioned = message.mentions.users.first();
  if (mentioned) return mentioned.id;

  const match = String(value || '').match(/^<@!?(\d{17,20})>$/) ||
    String(value || '').match(/^(\d{17,20})$/);
  return match ? match[1] : null;
}

function getLootboxCount(team, userId) {
  if (!team.lootboxes) return 0;
  if (typeof team.lootboxes.get === 'function') return team.lootboxes.get(userId) || 0;
  return team.lootboxes[userId] || 0;
}

module.exports = {
  name: 'lootbox-add',
  aliases: ['addlootbox', 'lbadd'],

  async execute(message, args) {
    if (!canManageEvent(message)) return;

    const userId = parseUserId(message, args[0]);
    const amount = args[1] === undefined ? 1 : Number(args[1]);

    if (!userId || !Number.isSafeInteger(amount) || amount === 0) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Usage: `fh addlootbox @user <positive or negative amount>`' })]
      });
    }

    const team = await TeamDB.findOne({ users: userId });
    if (!team) {
      return message.reply({ embeds: [errorEmbed({ description: 'That user is not in a team.' })] });
    }

    const current = getLootboxCount(team, userId);
    if (!team.lootboxes || typeof team.lootboxes.set !== 'function') {
      team.lootboxes = new Map(Object.entries(team.lootboxes || {}));
    }
    const newTotal = Math.max(0, current + amount);
    const changedBy = newTotal - current;
    team.lootboxes.set(userId, newTotal);
    await team.save();

    const isRemoval = amount < 0;
    const action = isRemoval ? 'Removed' : 'Added';
    const changedAmount = Math.abs(changedBy);

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Loot Boxes updated',
          description:
            `${action} **${changedAmount} Loot Box${changedAmount === 1 ? '' : 'es'}** ` +
            `${isRemoval ? 'from' : 'to'} <@${userId}>.\n` +
            `Available: **${newTotal}**.`
        })
      ],
      allowedMentions: { users: [] }
    });
  }
};
