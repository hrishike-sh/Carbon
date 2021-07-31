const disbut = require('discord-buttons')

module.exports = {
  commands: 'ping',
  category: 'Utility',
  description: 'Check bot\'s ws ping!',
  callback: async ({message}) => {
    let btn = new disbut.MessageButton()
      .setStyle('blurple')
      .setLabel('Pong!')
      .setID('ping_button')

    await message.channel.send('Click to check the ping!', {button: btn})
  }
}