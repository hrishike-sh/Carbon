const db = require('../../database/models/user')
const dbServer = require('../../database/models/settingsSchema')
const { Message, Client } = require('discord.js')
module.exports = {
    name: 'afk',
    cooldown: 10,
    fhOnly: true,
    category: 'Utility',
    usage: '[reason]',
    description: 'Displays an AFK message when someone pings you.',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     * @returns
     */
    async execute(message, args, client) {
        const admin = message.member.permissions.has('ADMINISTRATOR')
        let server = await dbServer.findOne({ guildID: message.guild.id })
        if (!server) {
            server = new dbServer({
                guildID: message.guild.id,
                afkIgnore: [],
            }).save()
        }
        if (args[0] == 'ignore' && admin) {
            const channel = message.mentions.channels.first() || message.channel

            if (server.afkIgnore) {
                server.afkIgnore.push(channel.id)
            } else {
                server.afkIgnore = [channel.id]
            }
            server.save()
            client.afkIgnore.push(channel.id)
            return message.channel.send(
                `Done! <#${channel.id}> is now AFK ignored.`
            )
        }
        if (['clear', 'remove'].includes(args[0]) && admin) {
            args.shift()
            if (!args[0])
                return message.channel.send(
                    'Either @ping the member or give me their id in order to remove their AFK.'
                )

            const mention =
                message.mentions.members.size > 0
                    ? message.mentions.members.first()
                    : message.guild.members.cache.get(args[0]) || null

            if (!mention)
                return message.channel.send('I could not find that user.')

            const dbUser = await db.findOne({ userId: mention.id })
            if (!dbUser || dbUser.afk.afk == false)
                return message.channel.send('The user is not AFK.')

            dbUser.afk.afk = false
            dbUser.save()
            return message.react('☑️')
        }
        if (
            !message.member.roles.cache.some(
                (role) => role.id === '824687430753189902'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '825283097830096908'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '831998003958906940'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '826196972167757875'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '839803117646512128'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '824348974449819658'
            )
        ) {
            message.channel
                .send(
                    `You dont have permissions to use this command, read perks for more info!`
                )
                .then((msg) => {
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
                    reason: 'AFK',
                },
            })
            newUser.save()
            user = newUser
        }

        const reason = args.join(' ') || 'AFK'

        user.afk = {
            afk: true,
            reason: reason,
            time: new Date(),
        }
        user.save()

        message.channel.send(
            `${message.member}, I have set your afk: ${reason}`
        )
        message.member.setNickname(`${message.member.displayName} ~ AFK`)
        setTimeout(() => {
            client.db.afks.push(message.author.id)
        }, 5000)
        return
    },
}
