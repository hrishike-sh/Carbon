const { Client, Message, MessageEmbed } = require('discord.js')
const Database = require('../../database/models/remind')
const { getMilliseconds } = require('better-ms')

module.exports = {
    name: 'remindme',
    aliases: ['rm', 'remind'],
    fhOnly: true,
    category: 'Utility',
    usage: '<reason> in <time>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        const example = '\n\n`fh rm work in 1h`'
        if (!args[0]) return message.reply('Provide valid arguments.' + example)

        const valid = args.join(' ').split(' in ')
        if (!valid.length)
            return message.reply('Please give valid time.' + example)

        const reason = valid.slice(0, -1) || 'something'
        let time = valid.pop()
        if (!getMilliseconds(time))
            return message.reply(
                `Please provide valid time. I could not parse \`${time}\`${example}`
            )

        time = new Date().getTime() + getMilliseconds(time)
        const id = (Math.random() + 1).toString(36).substring(7)
        const dbEntry = new Database({
            id,
            userId: message.author.id,
            time,
            reason,
            link: message.url,
        })
        dbEntry.save()
        client.db.reminders.push({
            id,
            userId: message.author.id,
            time,
            reason,
            link: message.url,
        })
        return message.reply(
            `${message.author.toString()} noted. I will remind you **${client.functions.formatTime(
                time,
                'R'
            )}** about ${reason}.\nType \`fh rm list\` to check your reminders!`
        )
    },
}
