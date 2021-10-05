const candeez = require('../../database/models/candies')

module.exports = {
    name: 'candy',
    aliases: ['candeez'],
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
            title: ':ghost: CANDEEZ :ghost:',
            description: `**${mem.tag}'s** candeez: ${bal.toLocaleString()}'`
        }})
    }
}