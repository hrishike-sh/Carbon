const { Message, Client } = require('discord.js');

module.exports = {
  name: 'auction',
  cooldown: 0,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const example =
      'fh auction <starting bid> <minumum increment> <time> <prize>\n\nEx.:`fh auction 250k 50k 2m blob & banana`';
  }
};
