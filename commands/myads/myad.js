const schema = require('../../database/models/ad')

module.exports = {
  name: 'myad',
  async execute(message, args){
    const userId = message.author.id
    const user = await schema.findOne({ userId })

    if(!user || !user.ads){
      message.delete()
      message.channel.send(`<@${userId}> you havent set your ad yet, type \`fh ad-setup\` to set it up!`).then(async m => {
        await sleep(2500)
        m.delete()
      })
      return
    }
    const ad = user.ads
    message.delete()
    message.channel.send(`<@${userId}>`, {embed: {
      title: `${message.author.username}'s Fight Ad`,
      description: ad,
      author: {
        name: message.author.username,
        icon_url: message.author.displayAvatarURL({ dynamic: false, format: 'png' }),
      },
      footer: {
        text: 'Setup your own ad using "fh ad-setup"'
      },
      color: 'RANDOM'
    }})
  }
}


function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}