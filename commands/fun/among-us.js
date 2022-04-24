const {
    Client,
    Message,
    MessageEmbed,
    MessageButton,
    MessageActionRow,
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
        const joinEmbed = new MessageEmbed()
            .setTitle('Among Us ' + emojis[0].toString())
            .setDescription(
                'Click the **Join** button to enter the game!\n\nMax players: **10**'
            )
            .setColor('GREEN')
        const getPlayers = (
            await message.channel.send({
                embeds: [joinEmbed],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Join')
                            .setCustomId(`join:${sessionId}`)
                            .setStyle('PRIMARY'),
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
            const components = [new MessageActionRow()]

            for (let i = 0; i < gamedata.length; i++) {
                if (components[0].components.length < 5) {
                    components[0].addComponents([
                        new MessageButton()
                            .setLabel(`${gamedata[i].user.displayName}`)
                            .setCustomId(gamedata[i].gameId)
                            .setStyle('SECONDARY'),
                    ])
                } else {
                    if (!components[1]) components.push(new MessageActionRow())
                    components[1].addComponents([
                        new MessageButton()
                            .setLabel(`${gamedata[i].user.displayName}`)
                            .setCustomId(gamedata[i].gameId)
                            .setStyle('SECONDARY'),
                    ])
                }
            }

            await message.channel.send({
                content: 'hey hrish',
                components,
            })
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
