const {
    Message,
    Client,
    Collection,
    MessageButton,
    MessageActionRow,
} = require('discord.js')
const presentSchema = require('../database/models/presentSchema')
const correctInfo = new Collection()
let dropCD = []
module.exports = {
    name: 'message',
    once: false,
    /**
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        let disabledDrop = client.db.disabledDrops
        //Checks
        if (!message.guild) return // no dms

        if (message.guild.id !== client.db.fighthub.id) return // Returns if the server is not fighthub

        if (disabledDrop.includes(message.channel.id)) return // Returns if the channel is disabled

        if (dropCD.includes(message.channel.id)) return // Returns if the channel has already had a drop recently

        const randomNum = Math.floor(Math.random() * 100) == 69 // Generates a random number and checks if it is 69

        if (!randomNum) return // 1/100 chance for the event to spawn
        //Checks

        /**
         * Event 1:
         *      # Throw the snowball at the snowman
         *      # Number: 1
         * Event 2:
         *      # Guess the emoji
         *      # Number: 2
         * Event 3:
         *      # Scramble Event (Christmas themed)
         *      # Number: 3
         */

        const randomPresents = Math.floor(Math.random() * 40) + 10
        addChannelToCD(message.channel.id, 60 * 1000)
        ;(await client.fetchWebhook('919473906425921596')).send({
            embeds: [
                {
                    title: 'New Drop',
                    description: `Dropped in <#${
                        message.channel.id
                    }> for ${randomPresents} presents.\n\nTime: <t:${(
                        new Date().getTime() / 1000
                    ).toFixed(0)}>`,
                },
            ],
            content: `<#${message.channel.id}>`,
        })
        const randomEvent = [1, 2, 3][Math.floor(Math.random() * 3)]
        if (randomEvent == 1) {
            const header = `**:snowman: Christmas Event :snowman:**\nHit the snowman with the snowball for presents!\n`
            const maps = [
                {
                    text: `🎄🎄🎄
⛄


<:blank:914473340129906708>`,
                    yes: 1,
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708>⛄


<:blank:914473340129906708>`,
                    yes: 2,
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708><:blank:914473340129906708>⛄


<:blank:914473340129906708>`,
                    yes: 3,
                },
            ]

            let leftButton = new MessageButton()
                .setEmoji('917049050929455144')
                .setStyle('SECONDARY')
                .setCustomId('cevent-l1')
            let middleButton = new MessageButton()
                .setEmoji('917049050929455144')
                .setStyle('SECONDARY')
                .setCustomId('cevent-m2')
            let rightButton = new MessageButton()
                .setEmoji('917049050929455144')
                .setStyle('SECONDARY')
                .setCustomId('cevent-r3')
            let row = new MessageActionRow().addComponents([
                leftButton,
                middleButton,
                rightButton,
            ])

            await message.channel.send(header)
            const firstCorrect = maps[Math.floor(Math.random() * 3)]
            const mainMessage = await message.channel.send({
                components: [row],
                content: `${firstCorrect.text}`,
            })

            correctInfo.set(mainMessage.id, {
                ended: false,
                correctAnswer: firstCorrect.yes,
                triedAndFailed: [],
            })

            editMessage(mainMessage, maps, header, row)

            const mainCollector = mainMessage.createMessageComponentCollector(
                (b) => b,
                {
                    time: 30 * 1000,
                    errors: ['time'],
                }
            )

            mainCollector.on('collect', async (button) => {
                if (
                    correctInfo
                        .get(button.message.id)
                        .triedAndFailed.includes(button.user.id)
                ) {
                    button.reply({
                        content:
                            "You're out of snowballs lol, you only have one chance.",
                        ephemeral: true,
                    })
                    return
                }

                const id = button.customId
                const answerChose = parseInt(id.replace(/[^0-9]/g, ''))
                const correctOne = parseInt(
                    correctInfo.get(button.message.id).correctAnswer
                )

                if (correctOne === answerChose) {
                    button.reply(
                        `${button.member} hit the snowman first.\n\n:gift: | You got **${randomPresents}** presents!`
                    )
                    correctInfo.get(button.message.id).ended = true

                    leftButton = leftButton.setDisabled()
                    middleButton = middleButton.setDisabled()
                    rightButton = rightButton.setDisabled()
                    if (correctOne == 1) {
                        leftButton = leftButton.setStyle('SUCCESS')
                    } else if (correctOne == 2) {
                        middleButton = middleButton.setStyle('SUCCESS')
                    } else {
                        rightButton = rightButton.setStyle('SUCCESS')
                    }
                    row = new MessageActionRow().addComponents([
                        leftButton,
                        middleButton,
                        rightButton,
                    ])

                    await mainMessage.edit(`${mainMessage.content}`, {
                        components: [row],
                    })
                    mainCollector.stop()

                    const userId = button.user.id
                    let dbUser = await presentSchema.findOne({ userId })

                    if (!dbUser) {
                        dbUser = new presentSchema({
                            userId,
                            presents: 0,
                        })
                    }

                    dbUser.presents = dbUser.presents + randomPresents
                    dbUser.save()
                } else {
                    correctInfo
                        .get(button.message.id)
                        .triedAndFailed.push(button.user.id)
                    button.reply({
                        content: 'Your aim is trash, you hit one of the tree.',
                        ephemeral: true,
                    })
                }
            })
        } else if (randomEvent == 2) {
            const emoji = ['🎅', '⛄', '🎄', '🎁', '🦌', '🧣', '🌨️', '❄️']
            const toGuess = emoji[Math.floor(Math.random() * emoji.length)]

            await message.channel.send(
                `**⛄ Christmas Event ⛄**\nMemorize & Guess the emoji to get some presents!`
            )
            const mainMessage = await message.channel.send(toGuess)
            await sleep(3000)

            let row = new MessageActionRow()
            let row2 = new MessageActionRow()

            for (let i = 0; i < emoji.length; i++) {
                if (i < 4) {
                    row = row.addComponents([
                        new MessageButton()
                            .setCustomId(emoji[i])
                            .setEmoji(emoji[i])
                            .setStyle('SECONDARY'),
                    ])
                } else {
                    row2 = row2.addComponents([
                        new MessageButton()
                            .setCustomId(emoji[i])
                            .setEmoji(emoji[i])
                            .setStyle('SECONDARY'),
                    ])
                }
            }

            mainMessage.edit({
                components: [row, row2],
                content: 'Which emoji was displayed?',
            })

            const mainCollector =
                await mainMessage.createMessageComponentCollector((b) => b, {
                    time: 30 * 1000,
                    errors: ['time'],
                })
            let guessedButFailed = []
            mainCollector.on('collect', async (button) => {
                const id = button.customId
                const correct = toGuess

                if (guessedButFailed.includes(button.user.id)) {
                    button.reply({
                        content: 'You can only guess once.',
                        ephemeral: true,
                    })
                    return
                } else {
                    if (id === correct) {
                        button.reply(
                            `${button.member} guessed the emoji.\n\n:gift: | You got **${randomPresents}** presents!`
                        )
                        mainCollector.stop()

                        row = new MessageActionRow()
                        row2 = new MessageActionRow()

                        for (let i = 0; i < emoji.length; i++) {
                            if (i < 4) {
                                if (emoji[i] === correct) {
                                    row = row.addComponents([
                                        new MessageButton()
                                            .setCustomId(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setStyle('SUCCESS')
                                            .setDisabled(),
                                    ])
                                } else {
                                    row = row.addComponents([
                                        new MessageButton()
                                            .setCustomId(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('SECONDARY'),
                                    ])
                                }
                            } else {
                                if (emoji[i] === correct) {
                                    row2 = row2.addComponents([
                                        new MessageButton()
                                            .setCustomId(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('SUCCESS'),
                                    ])
                                } else {
                                    row2 = row2.addComponents([
                                        new MessageButton()
                                            .setCustomId(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('SECONDARY'),
                                    ])
                                }
                            }
                        }

                        mainMessage.edit({
                            components: [row, row2],
                            content: `${mainMessage.content}`,
                        })
                        guessedButFailed = []

                        const userId = button.user.id
                        let dbUser = await presentSchema.findOne({ userId })

                        if (!dbUser) {
                            dbUser = new presentSchema({
                                userId,
                                presents: 0,
                            })
                        }

                        dbUser.presents = dbUser.presents + randomPresents
                        dbUser.save()
                    } else {
                        guessedButFailed.push(button.user.id)
                        button.reply({
                            content: 'That was not the emoji.',
                            ephemeral: true,
                        })
                    }
                }
            })
        } else if (randomEvent == 3) {
            const wordArray = [
                'santa',
                'chimney',
                'snowball',
                'snow',
                'sleigh',
                'reindeer',
                'presents',
                'bells',
            ]

            const randomWord =
                wordArray[Math.floor(Math.random() * wordArray.length)]
            const scrambledWord = scramble(randomWord)

            await message.channel.send(
                `**⛄ Christmas Event ⛄**\nGuess the scrambled word for presents!\n\nWord: **\`${scrambledWord}\`**`
            )

            const mainCollector = message.channel.createMessageCollector(
                (m) => m,
                {
                    time: 30 * 1000,
                }
            )

            mainCollector.on('collect', async (msg) => {
                if (msg.content.toLowerCase() === randomWord) {
                    mainCollector.stop('dont_check_for_this')
                    message.channel.send(
                        `${msg.member} guessed the right word.\n\n:gift: | You got **${randomPresents}** presents!`
                    )

                    const userId = msg.author.id
                    let dbUser = await presentSchema.findOne({ userId })

                    if (!dbUser) {
                        dbUser = new presentSchema({
                            userId,
                            presents: 0,
                        })
                    }

                    dbUser.presents = dbUser.presents + randomPresents
                    dbUser.save()
                }
            })
        } else;
    },
}

const editMessage = async (message, maps, header, row) => {
    for (let i = 0; i < 4; i++) {
        await sleep(3500)
        if (correctInfo.get(message.id).ended) break

        const random = maps[Math.floor(Math.random() * 3)]
        message.edit({
            components: [row],
            content: `${random.text}`,
        })

        const oldInfo = correctInfo.get(message.id)
        correctInfo.set(message.id, {
            ended: false,
            correctAnswer: random.yes,
            triedAndFailed: oldInfo.triedAndFailed,
        })
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function scramble(w) {
    let help = `${w}`
    let results = ''
    let randomLetter = ''
    for (i = 0; i < w.length; i++) {
        randomLetter = help.charAt(Math.floor(Math.random() * help.length))
        help = help.replace(randomLetter, '')
        results += randomLetter
    }
    return results
}

function addChannelToCD(id, ms) {
    dropCD.push(id)
    setTimeout(() => {
        dropCD = dropCD.filter((value) => value !== id)
    }, ms)
}
