
const { Message, Client } = require('discord.js');
const { MessageButton, MessageActionRow } = require('discord-buttons');

module.exports = {
    name: 'message',
    once: false,
    /**
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client) {

        //Checks
        if (message.guild.id !== client.storage.fighthub.id) return; // Returns if the server is not fighthub

        if (client.storage.disabledDrop.includes(message.channel.id)) return; // Returns if the channel is disabled

        if (client.dropCD.includes(message.channel.id)) return; // Returns if the channel has already had a drop recently

        // const randomNum = Math.floor(Math.random() * 100) == 69; // Generates a random number and checks if it is 69

        if (message.author.id !== '598918643727990784' && message.content !== 'Hm..') return; // test lol

        if (!randomNum) return; // 1/100 chance for the event to spawn
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


<:blank:914473340129906708><:snowball:917049050929455144>`,
                    yes: 1
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708>⛄


<:blank:914473340129906708><:snowball:917049050929455144>`,
                    yes: 2
                },
                {
                    text: `🎄🎄🎄
<:blank:914473340129906708><:blank:914473340129906708>⛄


<:blank:914473340129906708><:snowball:917049050929455144>`,
                    yes: 3
                }
            ]

            const leftButton = new MessageButton().setLabel("Left").setStyle("gray").setID('cevent-l1')
            const middleButton = new MessageButton().setLabel("Middle").setStyle("gray").setID('cevent-m1')
            const rightButton = new MessageButton().setLabel("Right").setStyle("gray").setID('cevent-r1')
            const row = new MessageActionRow().addComponents([leftButton, middleButton, rightButton])

            const mainMessage = await message.channel.send(`${header} ${maps[Math.floor(Math.random() * 3)]}`, {
                components: [row]
            });

            const mainCollector = mainMessage.createButtonCollector(
                b => b,
                {
                    time: 30 * 1000,
                    errors: ['time']
                }
            )

            mainCollector.on('collect', async button => {
                const id = button.id


            })


        } else if (randomEvent == 2) {

        } else if (randomEvent == 3) {

        } else;

    }
}

const editMessage = (message, maps, header, row) => {
    for (let i = 0; i < 4; i++) {
        await sleep(1750)

        message.edit(`${header} ${maps[Math.floor(Math.random() * 3)]}`, {
            components: [row]
        })
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}