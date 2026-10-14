module.exports = {
  name: 'shop',
  /**
   *
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    return message.reply('Shop is closed.');
  }
};
