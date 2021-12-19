const db = require('../../database/models/presentSchema')

const { Client, Message, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'rich',
    fhOnly: false,
    disabledChannels: [],
    description: "Check who's the richest for the christmas event!",
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        const rawLb = await db.find({}).sort({ presents: -1 }).limit(10)
        const a = [
            '<:blank:914473340129906708>🎅<:blank:914473340129906708>',
            '🦌➖🦌',
            '🦌➖🦌',
        ]

        const finalLb = rawLb
            .map(
                (value) =>
                    `${
                        a[rawLb.indexOf(value)] ||
                        '<:blank:914473340129906708><:blank:914473340129906708><:blank:914473340129906708>'
                    } - <@${
                        rawLb[rawLb.indexOf(value)].userId
                    }>[:](https://discord.gg/fight) **${rawLb[
                        rawLb.indexOf(value)
                    ].presents.toLocaleString()}** presents`
            )
            .join('\n')

        return message.channel.send(
            new MessageEmbed()
                .setTitle(':gift: Presents Leaderboard')
                .setDescription(finalLb)
                .setFooter('This is balanced')
        )
    },
}
