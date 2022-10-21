const {
    Client,
    Message,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
} = require('discord.js')
const { inspect } = require('util')
module.exports = {
    name: 'amongus',
    category: 'Fun',
    aliases: ['amogus'],
    fhOnly: false,
    disabledChannels: [],
    description: 'Start a game of amogus, right in discord!',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (!message.member.permissions.has('MANAGE_GUILD')) {
            return message.reply(
                'You need the `MANAGE_GUILD` permission to run this command.'
            )
        }
        const sessionId = client.functions.randomHash()
        const emojiIds = [
            '917726679214985246',
            '917726744457383936',
            '917726831485026314',
            '917726919062077490',
            '917726981964058624',
            '917727061651640350',
            '917727115183530044',
            '917727205453365278',
            '917727491660083220',
            '917727535704457237',
        ]
        const emojis = [
            client.emojis.cache.get('917726679214985246'),
            client.emojis.cache.get('917726744457383936'),
            client.emojis.cache.get('917726831485026314'),
            client.emojis.cache.get('917726919062077490'),
            client.emojis.cache.get('917726981964058624'),
            client.emojis.cache.get('917727061651640350'),
            client.emojis.cache.get('917727115183530044'),
            client.emojis.cache.get('917727205453365278'),
            client.emojis.cache.get('917727491660083220'),
            client.emojis.cache.get('917727535704457237'),
        ]
        const joinEmbed = new EmbedBuilder()
            .setTitle('Among Us ' + emojis[0].toString())
            .setDescription(
                'Click the **Join** button to enter the game!\n\nMax players: **10**'
            )
            .setColor('Green')
        const getPlayers = (
            await message.channel.send({
                embeds: [joinEmbed],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder()
                            .setLabel('Join')
                            .setCustomId(`join:${sessionId}`)
                            .setStyle(ButtonStyle.Primary),
                    ]),
                ],
            })
        ).createMessageComponentCollector({
            time: 15_000,
        })

        const gamedata = []

        getPlayers.on('collect', async (button) => {
            if (gamedata.find((v) => v.user.id === button.user.id)) {
                return button.reply({
                    content: 'You have already joined.',
                    ephemeral: true,
                })
            }
            if (gamedata.length > 9) {
                return button.reply({
                    content: 'The game is full.',
                    ephemeral: true,
                })
            }
            const temp = gamedata.length
            gamedata.push({
                user: button.member,
                gameId: `${button.member.id}:${emojiIds[temp]}`,
                impostor: false,
                votes: 0,
                messages: 0,
            })

            button.reply({
                content: `You have joined the game, you are ${emojis[
                    temp
                ].toString()}`,
                ephemeral: true,
            })
        })

        getPlayers.on('end', async () => {
            if (gamedata.length < 3) {
                return message.reply(
                    'You need more friends to play this game.\nMinimum players: 3'
                )
            }
            const components = [new ActionRowBuilder()]

            for (let i = 0; i < gamedata.length; i++) {
                if (components[0].components.length < 5) {
                    components[0].addComponents([
                        new ButtonBuilder()
                            .setLabel(`${gamedata[i].user.displayName}`)
                            .setCustomId(gamedata[i].gameId)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(gamedata[i].gameId.split(':')[1])
                            .setDisabled(),
                    ])
                } else {
                    if (!components[1]) components.push(new ActionRowBuilder())
                    components[1].addComponents([
                        new ButtonBuilder()
                            .setLabel(`${gamedata[i].user.displayName}`)
                            .setCustomId(gamedata[i].gameId)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(gamedata[i].gameId.split(':')[1])
                            .setDisabled(),
                    ])
                }
            }
            await message.channel.send({
                embeds: [
                    {
                        title: `Among Us`,
                        color: 'Green',
                        description: `**HOW TO WIN**:\n\n__Impostor__:\n> Send atleast 15 messages in order to win!\n__Crewmate__:\n> Start an Emergency Meeting by typing __emergency__ in chat and vote out whoever is sus!`,
                        footer: {
                            text: "Check your DMs! You have been DM'd your role!",
                            iconURL: emojis[0].url,
                        },
                    },
                ],
                components,
            })

            const impostor =
                gamedata[Math.floor(Math.random() * gamedata.length)]
            impostor.impostor = true
            for await (const user of gamedata) {
                await user.user.send({
                    content: `You are ${
                        user.impostor ? 'the **Impostor**' : 'a **Crewmate**'
                    }`,
                })
            }

            await message.channel.send(
                `Everyone was DM'd and the game has started! Good luck.`
            )

            const collector = await message.channel.createMessageCollector({
                filter: (msg) =>
                    gamedata.some((v) => v.user.id === msg.author.id),
            })
            let emergencies = 3
            let inEmergency = false
            collector.on('collect', async (msg) => {
                const user = gamedata.find((u) => u.user.id === msg.author.id)
                if (!inEmergency) user.messages++

                if (user.impostor && user.messages > 15) {
                    collector.stop()
                    return message.channel.send({
                        content: `${emojis
                            .map((a) => a.toString())
                            .join(
                                ''
                            )}\n\n${user.user.toString()} was the impostor and they got more than 15 messages!\nThey have won the game!!\n\n${emojis
                            .map((a) => a.toString())
                            .join('')}`,
                    })
                }
                if (msg.content.toLowerCase() === 'emergency') {
                    if (emergencies < 1) {
                        msg.reply({
                            content:
                                'You used the emergency button too many times and... IT BROKE!!!',
                        })
                        message.channel.send({
                            content: `${emojis
                                .map((a) => a.toString())
                                .join(
                                    ''
                                )}\n\n${impostor.user.toString()} has won the game!! They were the impostor.\n\n${emojis
                                .map((a) => a.toString())
                                .join('')}`,
                        })
                    }
                }
            })
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
