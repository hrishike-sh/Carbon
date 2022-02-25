const { Client, Message, MessageEmbed } = require('discord.js')
const Database = require('../../database/models/remind')
const ms = require('ms')

module.exports = {
    name: 'remindme',
    aliases: ['rm', 'remind'],
    fhOnly: true,
    category: 'Utility',
    usage: '<time>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (!args[0])
            return message.reply({
                embeds: [
                    {
                        description: `Please provide valid time!\nExample: "1d" "5m"`,
                    },
                ],
            })
        if (args[0] == 'list') {
            const user = await Database.find({
                userId: message.author.id,
            })
            if (!user)
                return message.reply("You don't have any active reminders.")
            let dat = []
            let i = 0
            for (const r of user) {
                i++
                dat.push(
                    `${i}. Reminder about ${r.reason} <t:${(
                        r.time / 1000
                    ).toFixed(0)}:R>`
                )
            }

            return message.reply({
                embeds: [
                    {
                        description: dat.join('\n') || 'No reminders yet...',
                        color: 'GREEN',
                    },
                ],
            })
        }
        let time = ms(args[0])
        if (isNaN(time))
            return message.reply({
                embeds: [
                    {
                        description: `Couldn't parse "${args[0]}" as valid time!\nTry: "1d" "5m" etc.`,
                    },
                ],
            })

        args.shift()
        if (!args[0]) args[0] = ' '
        if (!isNaN(ms(args[0]))) {
            time += ms(args[0])
            args.shift()
        }

        const reason = args.join(' ') || 'something'

        try {
            new Database({
                userId: message.author.id,
                channelId: message.channel.id,
                time: new Date().getTime() + time,
                reason,
                link: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
            }).save()
            client.db.reminders.push({
                userId: message.author.id,
                channelId: message.channel.id,
                time: new Date().getTime() + time,
                reason,
                link: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
            })
        } catch (e) {
            return message.reply({
                embeds: [
                    {
                        title: 'ERROR',
                        color: 'RED',
                        description: `There was an error:\n${e.message}`,
                    },
                ],
            })
        }

        message.reply(
            `I'll remind you about \`${reason}\` <t:${(
                (new Date().getTime() + time) /
                1000
            ).toFixed(0)}:R>`
        )
    },
}
