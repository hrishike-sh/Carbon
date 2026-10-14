const Database = require('../../database/models/grinder_dono');
const config = require('../../config');
const { neutralEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'grinderslist',
  aliases: ['glist'],
  async execute(message) {
    if (!message.member.roles.cache.has(config.roles.staff.cman)) return;
    const list = await Database.find({ guildID: message.guild.id, 'dynamic.grinder': true })
      .sort({ 'dynamic.expires': 1 }).select('userID dynamic.expires').lean();
    if (!list.length) return message.reply('There are no active grinders.');
    // Mentions display cached names without a separate Discord request for every row.
    for (let start = 0; start < list.length; start += 25) {
      const lines = list.slice(start, start + 25).map((entry, index) =>
        `**${String(start + index + 1).padStart(2, '0')}.** <@${entry.userID}> - <t:${Math.floor(entry.dynamic.expires / 1000)}:R>`);
      await message.reply({
        embeds: [neutralEmbed({ description: lines.join('\n') })],
        allowedMentions: { parse: [], repliedUser: false }
      });
    }
  }
};
