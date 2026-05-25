module.exports = {
  name: 'messageDelete',

  async execute(message) {
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    if (!message.author || message.author.bot) return;

    const client = message.client;
    let snipes = client.state.snipes.snipes.get(message.channel.id) || [];

    snipes.unshift({
      msg: message,
      image: message.attachments?.first()?.proxyURL || null,
      time: Date.now()
    });

    if (snipes.length > 25) snipes.pop();
    client.state.snipes.snipes.set(message.channel.id, snipes);
  }
};
