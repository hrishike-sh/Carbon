const { MessageButton, MessageActionRow } = require('discord-buttons')

module.exports = {
    name: 'fastclick',
    cooldown: 30,
    async execute(message, args){
        const user1 = message.member
        const user2 = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        if(!user2) return message.channel.send(`You must mention someone to play with them!\n\nExample: \`fh fastclick @Hrishikesh#0369\``)
        
    }
}