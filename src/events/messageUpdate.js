const logger = require('../utils/logger');
const { processDonationEdit } = require('../services/lotteryService');

module.exports = {
  name: 'messageUpdate',

  async execute(oldMessage, newMessage) {
    if (newMessage.partial) {
      try {
        await newMessage.fetch();
      } catch {
        return;
      }
    }

    try {
      await processDonationEdit(newMessage);
    } catch (error) {
      logger.error('Lottery donation processing error', error);
    }

    if (!newMessage.author || newMessage.author.bot) return;

    const client = newMessage.client;
    let snipes = client.state.snipes.esnipes.get(oldMessage.channel.id) || [];

    snipes.unshift({
      oldContent: oldMessage.content || '*[no content]*',
      newContent: newMessage.content || '*[no content]*',
      editedIn: newMessage.createdAt - oldMessage.editedAt,
      member: newMessage.member,
      author: newMessage.author,
      msg: newMessage
    });

    if (snipes.length > 25) snipes.pop();
    client.state.snipes.esnipes.set(oldMessage.channel.id, snipes);
  }
};
