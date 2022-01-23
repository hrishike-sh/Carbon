const { Client, Message, MessageEmbed } = require('discord.js')
const Database = require('../../database/models/remind')
const ms = require('ms')

module.exports = {
    name: 'remindme',
    aliases: ['rm', 'remind'],
    fhOnly: true,
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
