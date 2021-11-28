
const db = require('../../database/models/user')
const dbServer = require('../../database/models/settingsSchema')
const { Message, Client } = require('discord.js')
module.exports = {
    name: "afk",
    cooldown: 10,
    fhOnly: true,
    /**
     * 
     * @param {Message} message 
     * @param {String[]} args 
     * @param {Client} client 
     * @returns 
     */
    async execute(message, args, client) {
        const admin = message.member.permissions.has("ADMINISTRATOR")
        let server = dbServer.findOne({ guildID: message.guild.id })
        if (!server) {
            server = new dbServer({
                guildID: message.guild.id,
                afkIgnore: []
            }).save()
        }

        if (args[0] == 'ignore' && admin) {
            const channel = message.mentions.channels.first() || message.channel

            server.afkIgnore = [channel.id, ...server.afkIgnore]
            server.save()
            client.afkIgnore.push(channel.id)
            return message.channel.send(`Done! <#${channel.id}> is now AFK ignored.`)
        }
        if (
            !message.member.roles.cache.some(role => role.id === '824687430753189902') &&
            !message.member.roles.cache.some(role => role.id === '825283097830096908') &&
            !message.member.roles.cache.some(role => role.id === '831998003958906940') &&
            !message.member.roles.cache.some(role => role.id === '826196972167757875') &&
            !message.member.roles.cache.some(role => role.id === '839803117646512128') &&
            !message.member.roles.cache.some(role => role.id === '824348974449819658')
        ) {
            message.channel.send(`You dont have permissions to use this command, read perks for more info!`).then(msg => {
                setTimeout(() => {
                    msg.delete()
                }, 5000)
            })
            return
        }

        let user = await db.findOne({ userId: message.author.id })
        if (!user) {
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