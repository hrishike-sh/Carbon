module.exports = {
  name: 'messageUpdate',

  async execute(oldMessage, newMessage) {
    if (newMessage.author?.bot) return;

    const client = newMessage.client;
    let snipes = client.state.snipes.esnipes.get(oldMessage.channel.id) || [];

    snipes.unshift({
      oldContent: oldMessage.content,
      newContent: newMessage.content,
      editedIn: newMessage.createdAt - oldMessage.editedAt,
      member: newMessage.member,
      author: newMessage.author,
      msg: newMessage
    });

    client.state.snipes.esnipes.set(oldMessage.channel.id, snipes);
  }
};
