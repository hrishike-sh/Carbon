const { Message, Client } = require('discord.js');

module.exports = {
  name: 'unbanall',
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1243193938685460500')) return;

    const users = await message.guild.bans.fetch();
    for (const user of users.values()) {
      await message.guild.members.unban(user.user);
    }
    return message.reply(`Unbanned ${users.size} users.`);
  }
};
