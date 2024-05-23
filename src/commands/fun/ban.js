const { Message, Client } = require('discord.js');

module.exports = {
  name: '',
  aliases: [''],
  description: '',
  cooldown: 0,
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
