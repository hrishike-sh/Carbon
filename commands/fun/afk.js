
const db = require('../../database/models/user')

module.exports = {
    name: "afk",
    cooldown: 10,
    fhOnly: true,
    async execute(message, args, client){
        let user = await db.findOne({ userId: message.author.id })
        if(!user){
            const newUser = new db({
                userId: message.author.id,
                afk: {
                    afk: true,
                    reason: 'AFK'
                }
            })
            newUser.save()
        }

        const reason = args.join(" ") || 'AFK'

        user.afk = {
            afk: true,
            reason: reason,
            time: new Date()
        }
        client.afks.push(message.author.id)
        user.save()
    }
}