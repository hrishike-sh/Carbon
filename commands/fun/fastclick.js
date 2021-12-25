const { Message, MessageButton, MessageActionRow } = require('discord.js')
const ms = require('pretty-ms')
module.exports = {
    name: 'fastclick',
    usage: '<USER>',
    description: 'Use your skills to win fights, the fastest to click wins!',
    /**
     * @param {Message} message
     */
    async execute(message, args) {
        const user1 = message.member
        const user2 =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0])

        if (!user2)
            return message.channel.send(
                `You must mention someone to play with them!\n\nExample: \`fh fastclick @Hrishikesh#0369\``
            )

        let yesButton = new MessageButton()
            .setStyle('SUCCESS')
            .setCustomId('yes_fc')
            .setLabel('Accept')
        let noButton = new MessageButton()
            .setStyle('DANGER')
            .setCustomId('no_fc')
            .setLabel('Decline')
        let row = new MessageActionRow().addComponents([noButton, yesButton])
        const confirmation = await message.channel.send({
            embeds: [
                {
                    title: 'Confirmation',
                    color: 'YELLOW',
                    description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                    timestamp: new Date(),
                },
            ],
            components: [row],
        })
        const confirmationCollector =
            confirmation.createMessageComponentCollector((b) => b, {
                time: 30000,
            })

        confirmationCollector.on('collect', async (button) => {
            if (button.clicker.id !== user2.id) {
                return button.reply.send('This is not for you.', true)
            }

            if (button.id === 'yes_fc') {
                button.reply.defer()
                yesButton = yesButton.setDisabled()
                noButton = noButton
                    .setStyle('grey')
                    .setCustomId('no_fc')
                    .setDisabled()
                row = new MessageActionRow().addComponents([
                    yesButton,
                    noButton,
                ])
                confirmation.edit({
                    embeds: [
                        {
                            title: 'Challenge Accepted',
                            color: 'GREEN',
                            description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                            timestamp: new Date(),
                        },
                    ],
                    components: [row],
                })

                const mainMessage = await message.channel.send(
                    `Alright! The button will appear in a few seconds, good luck!`
                )
                let mainButton = new MessageButton()
                    .setStyle('SUCCESS')
                    .setLabel('This one')
                    .setCustomId('correct-fc')
                let baitButton1 = new MessageButton()
                    .setStyle('grey')
                    .setLabel('No not this')
                    .setCustomId('wrong1-fc')
                let baitButton2 = new MessageButton()
                    .setStyle('grey')
                    .setLabel('No not this')
                    .setCustomId('wrong2-fc')
                let baitButton3 = new MessageButton()
                    .setStyle('grey')
                    .setLabel('No not this')
                    .setCustomId('wrong3-fc')
                let baitButton4 = new MessageButton()
                    .setStyle('grey')
                    .setLabel('No not this')
                    .setCustomId('wrong4-fc')
                let array = [
                    mainButton,
                    baitButton1,
                    baitButton2,
                    baitButton3,
                    baitButton4,
                ].sort(() => Math.random() - 0.5)
                let mainRow = new MessageActionRow().addComponents(array)
                await sleep(2500)
                mainMessage.edit({
                    components: mainRow,
                    content: 'Click the green one!',
                })
                const now = new Date()

                const mainCollector =
                    mainMessage.createMessageComponentCollector((b) => b, {
                        time: 30000,
                    })
                mainCollector.on('collect', async (button) => {
                    if (
                        ![user1.id, user2.id].includes(button.clicker.user.id)
                    ) {
                        await button.reply.send('This is not for you', true)
                        return
                    }
                    mainCollector.stop()

                    if (button.id !== 'correct-fc') {
                        const loser = button.clicker.user.id
                        const winner = loser === user1.id ? user2.id : user1.id
                        mainButton = mainButton.setDisabled()
                        baitButton1 = baitButton1.setDisabled()
                        baitButton2 = baitButton2.setDisabled()
                        baitButton3 = baitButton3.setDisabled()
                        baitButton4 = baitButton4.setDisabled()
                        array = array
                        mainRow = new MessageActionRow().addComponents(array)
                        button.reply.defer()
                        mainMessage.edit({
                            components: mainRow,
                            content: `:trophy: <@${
                                [user1.id, user2.id].filter(
                                    (val) => val !== loser
                                )[0]
                            }> won because <@${loser}> clicked the wrong button!`,
                        })
                        return
                    }

                    if (
                        ![user1.id, user2.id].includes(button.clicker.user.id)
                    ) {
                        await button.reply.send('This is not for you', true)
                        return
                    }
                    const clickedIn = ms(new Date() - now, {
                        verbose: true,
                    })
                    const winner = button.clicker.user.id
                    mainButton = mainButton.setDisabled()
                    baitButton1 = baitButton1.setDisabled()
                    baitButton2 = baitButton2.setDisabled()
                    baitButton3 = baitButton3.setDisabled()
                    baitButton4 = baitButton4.setDisabled()
                    array = array
                    mainRow = new MessageActionRow().addComponents(array)
                    button.reply.defer()
                    mainMessage.edit({
                        components: mainRow,
                        content: `:trophy: <@${winner}> has won! The button was clicked in ${clickedIn}!`,
                    })
                    return
                })
            } else {
                button.reply.defer()
                yesButton = yesButton
                    .setStyle('grey')
                    .setCustomId('yes_fc')
                    .setDisabled()
                noButton = noButton.setDisabled()
                row = new MessageActionRow().addComponents([
                    yesButton,
                    noButton,
                ])
                confirmation.edit({
                    embeds: [
                        {
                            title: 'Challenge Declined',
                            color: 'RED',
                            description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                            timestamp: new Date(),
                        },
                    ],
                    components: [row],
                })
                return
            }
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
