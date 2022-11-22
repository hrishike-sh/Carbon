// const userSchema = require('../database/models/user')

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage, client) {
    // const userSettings = await userSchema.findOne({
    //     userId: newMessage.author.id,
    // })

    // if (userSettings?.messagesettings?.snipesDisabled === true) return

    let snipes = client.snipes.esnipes.get(oldMessage.channel.id) || [];

    snipes.unshift({
      oldContent: oldMessage.content,
      newContent: newMessage.content,
      editedIn: newMessage.createdAt - oldMessage.editedAt,
      member: newMessage.member,
      author: newMessage.author,
      msg: newMessage
    });

    client.snipes.esnipes.set(oldMessage.channel.id, snipes);
  }
};
