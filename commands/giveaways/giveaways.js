const { Message, Formatters, MessageEmbed } = require('discord.js')
const Database = require('../../database/models/giveaway')
module.exports = {
    name: 'giveaways',
    category: 'Giveaways',
    fhOnly: true,
    /**
     *
     * @param {Message} message
     */
    async execute(message) {
        const giveaways = await Database.find({ hasEnded: false })

        const map = giveaways
            .sort((a, b) => b.endsAt - a.endsAt)
            .map(
                (g, i) =>
                    `${i + 1}. Prize: **${
                        g.prize
                    }**\n_ __ _Ends: ${Formatters.time(
                        g.endsAt,
                        'R'
                    )}\n_ __ _Giveaway Link: [Jump](https://discord.com/channels/${
                        message.guild.id
                    }/${g.channelId}/${g.messageId})`
            )

        const embed = new MessageEmbed()
            .setTitle('Freeloader Machine')
            .setDescription(map.join('\n\n') || 'No active giveaways...')
    },
}
