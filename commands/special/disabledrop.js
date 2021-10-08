
const settings = require('../../database/models/settingsSchema')

module.exports = {
    name: 'disablechannel',
    async execute(message, args){
        if(!message.member.roles.cache.some(r => r.id === '824348974449819658')) return message.channel.send("You must have the admin role to run this command lol, works only in fh btw.")

        const channelId = message.channel.id

        const dis = await settings.findOne({ guildID: message.guild.id })

        if(dis.disabledDrop){
            dis.disabledDrop.push(channelId)
        } else dis.disabledDrop = [channelId]
        dis.save()

        return message.channel.send(`Done! This channel wont get any drops from now on!`)

    }
}