const { Message, Client } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'eslowmode',
  aliases: ['esm'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.giveawayManager)) return;

    const slowmode = args[0] || 0;
    message.channel.setRateLimitPerUser(slowmode);
    message.reply(`Set slowmode to ${slowmode} seconds.`);
  }
};
