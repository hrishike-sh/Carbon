
const deez = require('../../database/models/candies')

module.exports = {
    name: 'setcandy',
    aliases: ['setcandies'],
    async execute(message, args){
        const allowed = ['598918643727990784', '619339277993639956']

        if(!allowed.includes(message.author.id)) return

        const target = message.mentions.users.first() || null
        if(!target) return message.channel.send(`Please @ the user.`)

        args.shift()
        const amount = parseInt(args[0]) || null
        if(!amount || isNaN(amount)) return message.channel.send("Enter a valid amount.")
        
        let user = await deez.findOne({ userId: target.id })
        if(!user){
            user = new deez({
                userId: target.id,
                candies: amount
            })
            user.save()
            return message.channel.send(`Done! ${target} now has ${amount.toLocaleString()} candies.`)
        }
        user.candies = amount
        user.save()
        message.channel.send(`Done! ${target} now has ${amount.toLocaleString()} candies.`)

    }
}