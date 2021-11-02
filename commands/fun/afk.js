
const db = require('../../database/models/user')

module.exports = {
    name: "afk",
    cooldown: 10,
    fhOnly: true,
    async execute(message, args, client){
        if(
            !message.member.roles.cache.some(role => role.id === '824687430753189902') &&
            !message.member.roles.cache.some(role => role.id === '825283097830096908') &&
            !message.member.roles.cache.some(role => role.id === '831998003958906940') &&
            !message.member.roles.cache.some(role => role.id === '826196972167757875') &&
            !message.member.roles.cache.some(role => role.id === '839803117646512128') &&
            !message.member.roles.cache.some(role => role.id === '824348974449819658')
        ){
            message.channel.send(`You dont have permissions to use this command, read perks for more info!`).then(msg => {
                setTimeout(() => {
                    msg.delete()
                }, 5000)
            })
            return
        }
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
            user = newUser
        }

        const reason = args.join(" ") || 'AFK'

        user.afk = {
            afk: true,
            reason: reason,
            time: new Date()
        }
        user.save()

        message.channel.send(`${message.member}, I have set your afk: ${reason}`)
        setTimeout(() => {
            client.afks.push(message.author.id)
        }, 5000)
        return;
    }
}