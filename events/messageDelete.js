const { Message, Client } = require('discord.js');
const userSchema = require('../database/models/user');

module.exports = {
  name: 'messageDelete',
  once: false,
  /**
   *
   * @param {Message} message
   * @param {Client} client
   */
  async execute(message, client) {
    if (message.author.bot) return;

    const userSettings = await userSchema.findOne({
      userId: message.author.id
    });

    if (userSettings.messageSettings.snipesDisabled === true) return;

    let snipes = client.snipes.snipes.get(message.channel.id) || [];

    snipes.unshift({
      msg: message,
      image: message.attachments.first()?.proxyURL || null,
      time: Date.now()
    });

    client.snipes.snipes.set(message.channel.id, snipes);
  }
};
