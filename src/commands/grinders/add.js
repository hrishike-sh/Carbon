const Database = require('../../database/models/grinder_dono');
const config = require('../../config');

module.exports = {
  name: 'grinderadd',
  aliases: ['gadd'],
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.staff.cman)) {
      return message.reply('You must be a community manager to run this command!');
    }
    const user = message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user ||
      (/^\d{17,20}$/.test(args[0] || '') ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!user) return message.reply('Please mention a user to add to the list of grinders!');
    await Database.updateOne(
      { userID: user.id, guildID: message.guild.id },
      { $set: { 'dynamic.grinder': true, 'dynamic.expires': Date.now() + 3 * 86400000 } },
      { upsert: true }
    );
    return message.reply(`Added ${user} to the list of grinders!\n\nNote: This user's "expiry time" has been set to 3 days.`);
  }
};
