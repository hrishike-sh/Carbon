const candeez = require('../../database/models/candies')

module.exports = {
    name: 'candy',
    disabledChannels: ['870240187198885888'],
    description: "Check how many candeez you have.",
    async execute(message, args){
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