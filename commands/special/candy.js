const candeez = require('../../database/models/candies')

module.exports = {
    name: 'candy',
    description: "Check how many candeez you have.",
    async execute(message, args){
      if(message.channel.id === '870240187198885888'){
        message.delete()
        const msg = await message.channel.send(`${message.member} stop using commands in general!`)
        setTimeout(() => {
          msg.delete()
        }, 2500)
        return;
      }
        let target = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
        const mem = message.mentions.members.first() || message.member
        if(!target) target = message.author.id

        const user = await candeez.findOne({ userId: target })
        let bal;
        if(user){
            bal = user.candies
        } else bal = 0

        message.channel.send({ embed: {
            title: `${mem.user.tag}'s candeez!`,
            description: `**Candeez**: ${bal.toLocaleString()}`
        }})
    }
}