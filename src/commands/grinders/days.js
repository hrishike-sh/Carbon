const Database = require('../../database/models/grinder_dono');
const config = require('../../config');

module.exports = {
  name: 'grinderday',
  aliases: ['gday'],
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.staff.cman)) return;
    const user = message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user ||
      (/^\d{17,20}$/.test(args[0] || '') ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!user) return message.reply('Please mention a user!');
    const days = Number(args[1]);
    const delta = days * 86400000;
    if (!Number.isSafeInteger(days) || days === 0 || !Number.isSafeInteger(delta)) {
      return message.reply('Please specify a nonzero whole number of days!');
    }
    const db = await Database.findOneAndUpdate(
      {
        userID: user.id, guildID: message.guild.id, 'dynamic.grinder': true,
        'dynamic.expires': { $gte: Math.max(0, -delta), $lte: Math.min(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - delta) }
      },
      { $inc: { 'dynamic.expires': delta } },
      { new: true }
    );
    if (!db) return message.reply('This user is not a grinder, or that change would produce an invalid expiry time.');
    return message.reply(`Added **${days}** days to **${user.tag}**\n\nTheir grinder now expires <t:${Math.floor(db.dynamic.expires / 1000)}:R>`);
  }
};
