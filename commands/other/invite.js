const {
  MessageButton
} = require('discord-buttons');

module.exports = {
  name: 'invite',
  aliases: ['inv'],
  description: 'Invite the bot.',
  execute(message, args) {
    const but = new MessageButton()
      .setLabel('Invite')
      .setStyle('url')
      .setURL('https://discord.com/api/oauth2/authorize?client_id=855652438919872552&permissions=140257912897&scope=bot')

    message.channel.send("You can invite me by using the button.", {
      component: but,
    })
  }
}