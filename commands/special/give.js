
const candies = require('../../database/models/candies')

module.exports = {
    name: 'give',
    description: 'Give candies to someone',
    usage: '@USER amount',
    cooldown: 0,
    async execute(message, args){

        const user1 = await candies.findOne({ userId: message.author.id })
        const user1Amount = user1.candies || 0

        const mention = message.mentions.users.first() 
        if(!mention) return message.channel.send("Please mention someone to send them candies")
        let user2 = await candies.findOne({ userId: mention.id })
        if(!user2){
            user2 = new candies({
                userId: mention.id,
                candies: 0
            })
            user2.save()
        }
        const user2Amount = user2 ? user2.candies : 0

        if(user1Amount <= 0){
            return message.channel.send("You have 0 candies, what are you sharing?")
        }

        args.shift()
        if(message.author.id === mention.id) return message.channel.send(`You cannot give candies to yourself.`)
        if(mention.bot) return message.channel.send(`You cannot send candies to bots`)
        if(!args[0]) return message.channel.send(`How many candies do you want to give?`)

        const amount = parseInt(Number(args[0]).toFixed(0))
        if(isNaN(amount)) return message.channel.send(`Please enter a valid amount.`)

        if(amount - 1 >= user1Amount) return message.channel.send(`You do not have ${amount.toLocaleString()} candies.`)

        // everything is fine?
        try{
        user1.candies -= amount
        user1.save()
        user2.candies += amount
        user2.save()
        } catch(e){
            return message.channel.send(`An error occured ` + e)
        }

        message.channel.send(`You gave ${amount.toLocaleString()} candies to <@${mention.id}>`)
        mention.send({ embed: {
            title: 'You have been given coins!',
            color: 'GREEN',
            description: `**${message.author.tag}** has given you **${amount.toLocaleString()}** candies`,
            footer: {
                text: 'simp much',
            }
        }})
    }
}