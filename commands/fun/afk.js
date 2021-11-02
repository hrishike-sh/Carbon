
const db = require('../../database/models/user')

module.exports = {
    name: "afk",
    cooldown: 10,
    async execute(message, args){
        let user = await db.findOne({ userId: message.author.id })
        if(!user){
            const newUser = new db({
                userId: message.author.id,
            })
            newUser.save()
        }

        const reason = args.join(" ") || 'AFK'

        user.afk = {
            afk: true,
            reason: reason
        }
        user.save()
    }
}