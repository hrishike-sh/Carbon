const { Message, Client, EmbedBuilder } = require('discord.js');
const DB = require('../../database/coins');

module.exports = {
  name: 'shop',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const userId = message.author.id;
    let DBUser = await DB.findOne({
      userId
    });
    if (!DBUser) {
      DBUser = new DB({
        userId
      });
    }
    const coins = DBUser.coins;
    const embed = new EmbedBuilder().setTitle('Perks Shop');
  }
};
