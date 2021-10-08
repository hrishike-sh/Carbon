
const candies = require('../../database/models/candies')

module.exports = {
    name: 'trickortreat',
    cooldown: 300,
    async execute(message, args){
        const total = await candies.find({ userId: message.author.id })
        if(!total || total === 0) return message.channel.send("0 candies imagine.")

        
    }
}