const { Message, Client } = require('discord.js');

module.exports = {
  name: 'eslowmode',
  aliases: 'esm',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('925033181990756392')) return;

    const slowmode = args[0] || 0;
    message.channel.setRateLimitPerUser(slowmode);
    message.reply(`Set slowmode to ${slowmode} seconds.`);
  }
};
