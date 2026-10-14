const Database = require('../../database/models/grinder_dono');
const config = require('../../config');

module.exports = {
  name: 'grinderremove',
  aliases: ['gremove'],
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.staff.cman)) {
      return message.reply('You must be a community manager to run this command!');
    }
    const user = message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user ||
      (/^\d{17,20}$/.test(args[0] || '') ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!user) return message.reply('Please mention a user to remove from the list of grinders!');
    await Database.updateOne(
      { userID: user.id, guildID: message.guild.id },
      { $set: { 'dynamic.grinder': false, 'dynamic.expires': Date.now() } }
    );
    return message.reply(`Removed ${user} from the list of grinders!`);
  }
};
