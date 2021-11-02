
const db = require('../database/models/user')

module.exports = {
    name: 'message',
    once: false,
    async execute(message, args){
        if(message.mentions.users.size < 1) return;
        if(message.guild.id !== '824294231447044197') return;
        const mention = message.mentions.users.first().id
        const user = await db.findOne({ userId: mention })

        if(!user) return;
        if(!user.afk.afk) return;

        console.log("AFK user pinged!")
    }
}