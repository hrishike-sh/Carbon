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

    if (!userId || !Number.isSafeInteger(amount) || amount <= 0) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Usage: `fh addlootbox @user [amount]`' })]
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
    team.lootboxes.set(userId, current + amount);
    await team.save();

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Loot Boxes added',
          description:
            `Added **${amount} Loot Box${amount === 1 ? '' : 'es'}** to <@${userId}>.\n` +
            `Available: **${current + amount}**.`
        })
      ],
      allowedMentions: { users: [] }
    });
  }
};
