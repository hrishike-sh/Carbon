const { Message } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    if (!message.author) return;
    if (message?.author.bot) return;
    const client = message.client;

    let snipes = client.snipes.snipes.get(message.channel.id) || [];

    snipes.unshift({
      msg: message,
      image: message.attachments?.first()?.proxyURL || null,
      time: Date.now()
    });

    client.snipes.snipes.set(message.channel.id, snipes);
  }
};
