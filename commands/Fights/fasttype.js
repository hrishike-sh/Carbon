const {
    Client,
    Message,
    MessageEmbed,
    MessageButton,
    MessageActionRow,
} = require('discord.js')
const ms = require('pretty-ms')
const txtgen = require('txtgen')
module.exports = {
    name: 'fasttype',
    fhOnly: false,
    disabledChannels: [],
    usage: '<user>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        return message.channel.send('This command is disabled.')
        const target = message.mentions.users.first() || null
        const blank = '<:blank:914473340129906708>'
        if (!target)
            return message.channel.send(
                `You will have to ping someone to play with them bozo`
            )

        const yesBut = new MessageButton()
            .setCustomId('yes-ft')
            .setLabel('Confirm')
            .setStyle('SUCCESS')
        const noBut = new MessageButton()
            .setCustomId('no-ft')
            .setLabel('Decline')
            .setStyle('DANGER')
        const row = new MessageActionRow().addComponents([yesBut, noBut])

        const confirmation = await message.channel.send({
            embed: new MessageEmbed()
                .setTitle('Confirmation')
                .setDescription(
                    `${target}, ${message.member} challenges you for a game of fasttype.\nWhat do you say?`
                )
                .setTimestamp()
                .setFooter('Use the buttons!', client.user.displayAvatarURL()),
            components: [row],
        })

        const confirmationCollector =
            confirmation.createMessageComponentCollector((b) => b, {})

        confirmationCollector.on('collect', async (button) => {
            const id = button.customId

            if (button.user.id !== target.id) {
                button.reply.send('This is not for you.', true)
                return
            }

            if (id == 'no-ft') {
                confirmation.deletable()
                confirmationCollector.stop()
                return message.channel.send('This challenge was declined.')
            } else {
                confirmation.delete()
                message.channel.send(`The challenge was accepted, goodluck.`)

                let sentence = txtgen.sentence()
                const rawSentence = sentence
                const emptychar = '‎'
                sentence = sentence.split('')
                sentence = sentence.join(emptychar)
                sentence = sentence.split(' ')
                sentence = sentence.join(' ')

                const embed = new MessageEmbed()
                    .setTitle('Type Racing')
                    .setDescription(
                        `**Rules:**\n${blank}1) Copy Paste **does not** work.\n${blank}2) Any form of malpractice is not allowed.\n${blank}3) This is **not** case sensitive.`
                    )
                    .addField('Sentence:', sentence, true)
                    .setColor('GREEN')
                    .setFooter('Good Luck.', client.user.displayAvatarURL())

                message.channel.send({ embed })

                const mainCollector = message.channel.createMessageCollector(
                    (m) => [message.author.id, target.id].includes(m.author.id),
                    {
                        time: 30000,
                    }
                )
                const then = new Date().getTime()

                mainCollector.on('collect', async (msg) => {
                    if (msg.content.includes(emptychar)) {
                        mainCollector.stop()

                        return message.channel.send(
                            `${
                                msg.author
                            } tried cheating, and copy-pasted the message.\n:trophy: | The winner is <@${[
                                message.author.id,
                                target.id,
                            ].filter((u) => u !== msg.author.id)}>`
                        )
                    }

                    if (
                        msg.content.toLowerCase() === rawSentence.toLowerCase()
                    ) {
                        mainCollector.stop()
                        const now = new Date().getTime()
                        const timetaken = now - then
                        const wpm = (
                            rawSentence.split(' ').length /
                            (timetaken * 60)
                        ).toFixed(1)

                        msg.channel.send(
                            `:trophy: | ${
                                msg.author
                            } has won the game! Stats:\n${blank}WPM: **${wpm}**\n${blank}Time taken: **${ms(
                                timetaken,
                                { verbose: true }
                            )}**`
                        )
                    } else {
                        return msg.reply(
                            "Nice try, but you didn't get it right.\nYou can still try."
                        )
                    }
                })
            }
        })
    },
}
