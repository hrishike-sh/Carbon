
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

        const randomEvent = [1, 2, 3][Math.floor(Math.random() * 3)]

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
                    button.reply.send("You already gave your answer, stfu.", true)
                    return
                }

                const id = button.id
                const answerChose = parseInt(id.replace(/[^0-9]/g, ''))
                const correctOne = parseInt(correctInfo.get(button.message.id).correctAnswer)

                console.log(`Correct answer: ${correctOne}\nAnswer chose: ${answerChose}         ${correctOne === answerChose}`)

                if (correctOne === answerChose) {

                    button.reply.send(`${button.clicker.member} got the correct answer!`)
                    correctInfo.get(button.message.id).ended = true

                    leftButton = leftButton.setDisabled()
                    middleButton = middleButton.setDisabled()
                    rightButton = rightButton.setDisabled()
                    row = new MessageActionRow().addComponents([leftButton, middleButton, rightButton])

                    await mainMessage.edit(`${mainMessage.content}`, {
                        components: [row]
                    })
                    mainCollector.stop()

                } else {

                    correctInfo.get(button.message.id).triedAndFailed.push(button.clicker.user.id)
                    button.reply.send("Better luck next time, you failed.", true)

                }

            })


        } else if (randomEvent == 2) {

        } else if (randomEvent == 3) {

        } else;

    }
}

const editMessage = async (message, maps, header, row) => {
    for (let i = 0; i < 4; i++) {
        await sleep(2500)
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