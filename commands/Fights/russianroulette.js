const channels = []
const { MessageButton, MessageActionRow } = require('discord-buttons')
const { Client, Message, MessageEmbed } = require('discord.js')
module.exports = {
    name: 'russianroulette',
    aliases: ['rr'],
    description: 'Start a game of russian roulette!',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        if (channels.includes(message.channel.id)) {
            return message.channel.send(
                `This channel already has a game active.`
            )
        }
        if (message.author.id !== '598918643727990784') return

        const joinBut = new MessageButton()
            .setLabel('Join')
            .setEmoji('⚔️')
            .setID('join-rr')
            .setStyle('green')
        const infoBut = new MessageButton()
            .setLabel('Info')
            .setEmoji('ℹ️')
            .setID('info-rr')
            .setStyle('grey')
        const row = new MessageActionRow().addComponents([joinBut, infoBut])
        const joined = []
        let gameData = []
        const joinMessage = await message.channel.send({
            embed: {
                title: 'Russian Roulette',
                description:
                    'Click the button to join the game!\nThe game begins in **15 seconds**.',
                color: 'GREEN',
            },
            components: row,
        })

        const joinCollector = joinMessage.createButtonCollector((b) => b, {
            time: 15000,
        })

        joinCollector.on('collect', async (button) => {
            const id = button.id
            if (id === 'join-rr') {
                if (joined.includes(button.clicker.user.id)) {
                    button.reply.send('You have already joined the game.', true)
                    return
                }
                joined.push(button.clicker.user.id)
                gameData.push({
                    member: button.clicker,
                    dead: false,
                })

                button.reply.send(`You have entered the game, good luck!`, true)
                return
            } else {
                let participants = ''
                gameData.forEach((value, index) => {
                    participants += `${index + 1}. **${
                        value.member.user.tag
                    }**\n`
                })
                return button.reply.send({
                    embed: {
                        title: 'Game Info',
                        description:
                            'Russian Roulette - All the users will be given a gun, the gun will have **1** bullet. The users then have to spin the barrel of the revolver and shoot themselves(in the game :sob:). If you are lucky you will survive, else you will be eliminated by yourself. Last player standing wins! Good luck!',
                        fields: [
                            {
                                name: 'Participants',
                                value: participants || 'None',
                            },
                        ],
                        color: 'RED',
                    },
                    ephemeral: true,
                })
            }
        })
        joinCollector.on('end', async () => {
            message.channel.send({
                embed: {
                    title: 'Russian Roulette',
                    description: 'The game will now begin.',
                    fields: [
                        {
                            name: 'Participants',
                            value: `${gameData
                                .map((value) => `${value.member.member}`)
                                .join(', ')}`,
                        },
                    ],
                    color: 'YELLOW',
                },
            })

            const mainEmbed = await message.channel.send(
                new MessageEmbed().setDescription('Initialising game...')
            )

            for (a = 0; a > -1; i++) {
                let deathNumber = Math.floor(Math.random() * gameData.length)
                if (deathNumber == 1) {
                    await message.channel.send(
                        `The winner is ${gameData[0].member}`
                    )
                    break
                }
                if (deathNumber == 0) deathNumber = gameData.length - 1

                let winner
                let deathMap
                let deaths = []

                await sleep(2500)

                mainEmbed.edit(
                    new MessageEmbed().setDescription(
                        `**${deathNumber} shot(s)** were fired...`
                    )
                )

                for (i = 0; i < deathNumber + 1; i++) {
                    if (gameData.length == 1) {
                        message.channel.send(
                            new MessageEmbed()
                                .setTitle('WINNER')
                                .setColor('GREEN')
                                .setDescription(
                                    `The winner of the game is ${gameData[0].member.member}`
                                )
                        )
                        break
                    }
                    const death =
                        gameData[Math.floor(Math.random() * gameData.length)]

                    if (deaths.includes(death)) {
                        --i
                        continue
                    }

                    deaths.push(death)
                }
                if (gameData.length == 1) break

                deathMap = deaths
                    .map((value) => `<@${value.member.id}>`)
                    .join(', ')

                await sleep(2000)

                mainEmbed.edit(
                    new MessageEmbed()
                        .setDescription(
                            `People who tried their luck, and unfortunately died were: \n${deathMap}`
                        )
                        .setColor('RED')
                )

                gameData = gameData.filter((a) => !deaths.includes(a))

                await sleep(2000)

                mainEmbed.edit(
                    new MessageEmbed()
                        .setDescription(
                            `People that survived are:\n${gameData
                                .map((u) => `<@${u.member.id}>`)
                                .join(', ')}`
                        )
                        .setColor('GREEN')
                )
            }
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
