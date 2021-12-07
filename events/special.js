
const { Message, Client, Collection } = require('discord.js');
const { MessageButton, MessageActionRow } = require('discord-buttons');
const correctInfo = new Collection()
module.exports = {
    name: 'message',
    once: false,
    /**
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client) {

        //Checks
        // if (message.guild.id !== client.storage.fighthub.id) return; // Returns if the server is not fighthub

        // if (client.storage.disabledDrop.includes(message.channel.id)) return; // Returns if the channel is disabled

        if (client.dropCD.includes(message.channel.id)) return; // Returns if the channel has already had a drop recently

        // const randomNum = Math.floor(Math.random() * 100) == 69; // Generates a random number and checks if it is 69

        if (message.author.id !== '598918643727990784') return; // test lol
        if (message.content !== 'Hm..') return;

        // if (!randomNum) return; // 1/100 chance for the event to spawn
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

        const randomEvent = 3 //[1, 2, 3][Math.floor(Math.random() * 3)]

        if (randomEvent == 1) {
            const header = `**:snowman: Christmas Event :snowman:**\nHit the snowman with the snowball for presents!\n`;
            const maps = [
                {
                    text: `🎄🎄🎄
⛄


<:blank:914473340129906708>`,
                    yes: 1
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708>⛄


<:blank:914473340129906708>`,
                    yes: 2
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708><:blank:914473340129906708>⛄


<:blank:914473340129906708>`,
                    yes: 3
                }
            ]

            let leftButton = new MessageButton().setEmoji("917049050929455144").setStyle("gray").setID('cevent-l1')
            let middleButton = new MessageButton().setEmoji("917049050929455144").setStyle("gray").setID('cevent-m2')
            let rightButton = new MessageButton().setEmoji("917049050929455144").setStyle("gray").setID('cevent-r3')
            let row = new MessageActionRow().addComponents([leftButton, middleButton, rightButton])

            await message.channel.send(header)
            const firstCorrect = maps[Math.floor(Math.random() * 3)]
            const mainMessage = await message.channel.send(`${firstCorrect.text}`, {
                components: [row]
            });

            correctInfo.set(mainMessage.id, {
                ended: false,
                correctAnswer: firstCorrect.yes,
                triedAndFailed: []
            })

            editMessage(mainMessage, maps, header, row);

            const mainCollector = mainMessage.createButtonCollector(
                b => b,
                {
                    time: 30 * 1000,
                    errors: ['time']
                }
            )

            mainCollector.on('collect', async button => {

                if (correctInfo.get(button.message.id).triedAndFailed.includes(button.clicker.user.id)) {
                    button.reply.send("You're out of snowballs lol, you only have one chance.", true)
                    return
                }

                const id = button.id
                const answerChose = parseInt(id.replace(/[^0-9]/g, ''))
                const correctOne = parseInt(correctInfo.get(button.message.id).correctAnswer)

                if (correctOne === answerChose) {

                    button.reply.send(`${button.clicker.member} hit the snowman first!`)
                    correctInfo.get(button.message.id).ended = true

                    leftButton = leftButton.setDisabled()
                    middleButton = middleButton.setDisabled()
                    rightButton = rightButton.setDisabled()
                    if (correctOne == 1) {
                        leftButton = leftButton.setStyle('green')
                    } else if (correctOne == 2) {
                        middleButton = middleButton.setStyle('green')
                    } else {
                        rightButton = rightButton.setStyle('green')
                    }
                    row = new MessageActionRow().addComponents([leftButton, middleButton, rightButton])

                    await mainMessage.edit(`${mainMessage.content}`, {
                        components: [row]
                    })
                    mainCollector.stop()

                } else {

                    correctInfo.get(button.message.id).triedAndFailed.push(button.clicker.user.id)
                    button.reply.send("Your aim is trash, you hit one of the tree.", true)

                }

            })


        } else if (randomEvent == 2) {

            const emoji = [
                '🎅', '⛄', '🎄',
                '🎁', '🦌', '🧣',
                '🌨️', '❄️'
            ]
            const toGuess = emoji[Math.floor(Math.random() * emoji.length)]

            await message.channel.send(`**⛄ Christmas Event ⛄**\nMemorize & Guess the emoji to get some presents!`)
            const mainMessage = await message.channel.send(toGuess)
            await sleep(3000)

            let row = new MessageActionRow()
            let row2 = new MessageActionRow()

            for (let i = 0; i < emoji.length; i++) {
                if (i < 4) {
                    row = row.addComponent(
                        new MessageButton()
                            .setID(emoji[i])
                            .setEmoji(emoji[i])
                            .setStyle('grey')
                    )
                } else {
                    row2 = row2.addComponent(
                        new MessageButton()
                            .setID(emoji[i])
                            .setEmoji(emoji[i])
                            .setStyle('grey')
                    )
                }
            }

            mainMessage.edit("Which emoji was displayed?", {
                components: [row, row2]
            })

            const mainCollector = await mainMessage.createButtonCollector(
                b => b,
                {
                    time: 30 * 1000,
                    errors: ['time']
                }
            )
            let guessedButFailed = []
            mainCollector.on('collect', async button => {

                const id = button.id
                const correct = toGuess

                if (guessedButFailed.includes(button.clicker.user.id)) {
                    button.reply.send("You can only guess once.", true)
                    return
                } else {
                    if (id === correct) {
                        button.reply.send(`${button.clicker.member} guessed the emoji!`)
                        mainCollector.stop()

                        row = new MessageActionRow()
                        row2 = new MessageActionRow()

                        for (let i = 0; i < emoji.length; i++) {
                            if (i < 4) {
                                if (emoji[i] === correct) {
                                    row = row.addComponent(
                                        new MessageButton()
                                            .setID(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setStyle('green')
                                            .setDisabled()
                                    )
                                } else {
                                    row = row.addComponent(
                                        new MessageButton()
                                            .setID(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('grey')
                                    )
                                }
                            } else {
                                if (emoji[i] === correct) {
                                    row2 = row2.addComponent(
                                        new MessageButton()
                                            .setID(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('green')
                                    )
                                } else {
                                    row2 = row2.addComponent(
                                        new MessageButton()
                                            .setID(emoji[i])
                                            .setEmoji(emoji[i])
                                            .setDisabled()
                                            .setStyle('grey')
                                    )
                                }
                            }
                        }

                        mainMessage.edit(`${mainMessage.content}`, {
                            components: [row, row2]
                        })
                        guessedButFailed = []
                    } else {

                        guessedButFailed.push(button.clicker.user.id)
                        button.reply.send("That was not the emoji.", true)

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
                'bells'
            ]

            const randomWord = wordArray[Math.floor(Math.random() * wordArray.length)]
            const scrambledWord = scramble(randomWord)

            await message.channel.send(`**⛄ Christmas Event ⛄**\nGuess the scrambled word for presents!\n\nWord: **\`${scrambledWord}\`**`)

            const mainCollector = message.channel.createMessageCollector(
                m => m,
                {
                    time: 30 * 1000,
                }
            )

            mainCollector.on('collect', async msg => {

                if (msg.content.toLowerCase() === randomWord) {
                    mainCollector.stop('dont_check_for_this')
                    return message.channel.send(`${msg.member} guessed the right word`)
                }

            })

        } else;

    }
}

const editMessage = async (message, maps, header, row) => {
    for (let i = 0; i < 4; i++) {
        await sleep(3500)
        if (correctInfo.get(message.id).ended) break;

        const random = maps[Math.floor(Math.random() * 3)]
        message.edit(`${random.text}`, {
            components: [row]
        })

        const oldInfo = correctInfo.get(message.id)
        correctInfo.set(message.id, {
            ended: false,
            correctAnswer: random.yes,
            triedAndFailed: oldInfo.triedAndFailed
        })
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function scramble(w) {
    let help = `${w}`;
    let results = '';
    let randomLetter = ''
    for (i = 0; i < w.length; i++) {
        randomLetter = help.charAt(Math.floor(Math.random() * help.length))
        help = help.replace(randomLetter, '')
        results += randomLetter
    }
    return results
}