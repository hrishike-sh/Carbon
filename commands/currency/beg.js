const { Client, Message, MessageEmbed } = require('discord.js')
const { addCoins } = require('../../functions/currency')

module.exports = {
    name: 'beg',
    fhOnly: true,
    cooldown: 15,
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        const MESSAGES = [
            'Hrish has not added any cool comments here. In compensation you receive {{coins}} coins.',
        ]
        const randomComment =
            MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

        const randomAmount = Math.floor(Math.random() * 10000) + 5000
        const added = await addCoins(message.author.id, randomAmount)
        message.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle('The bot devs are lazy')
                    .setColor('RANDOM')
                    .setDescription(
                        randomComment.replace(
                            '{{coins}}',
                            randomAmount.toLocaleString()
                        )
                    )
                    .setFooter({
                        iconURL: message.author.displayAvatarURL(),
                        text: `You now have a total of ${added.toLocaleString()} coins!`,
                    }),
            ],
        })
    },
}
