const { Message, Client } = require('discord.js');

module.exports = {
  name: 'ban',
  cooldown: 5,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    message.reply('TEST');
  }
};
