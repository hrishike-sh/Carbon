const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const { listenerCount } = require('process')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('splitorsteal')
        .setDescription('Start a game of split or steal with someone!')
        .addUserOption((option) => {
            return option
                .setName('user1')
                .setDescription('The first user.')
                .setRequired(true)
        })
        .addUserOption((option) => {
            return option
                .setName('user2')
                .setDescription('The second user.')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('prize')
                .setDescription('The prize for split or steal.')
                .setRequired(true)
        }),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            user1: interaction.options.getUser('user1'),
            user2: interaction.options.getUser('user2'),
            prize: interaction.options.getString('prize'),
        }

        let mainEmbed = new MessageEmbed()
            .setTitle('Split or Steal')
            .setDescription(
                'The game will start when both the parties are ready.\nHit **Ready** when you are ready!'
            )
            .setColor('YELLOW')
            .setTimestamp()

        let components = new MessageActionRow().addComponents([
            new MessageButton()
                .setLabel('READY')
                .setStyle('SUCCESS')
                .setCustomId('ready-sos'),
        ])
        const gamedata = {
            user1: {
                user: data.user1,
                ready: false,
                choice: null,
            },
            user2: {
                user: data.user2,
                ready: false,
                choice: null,
            },
        }

        await interaction.reply({
            content: 'Done, the game is now started.',
            ephemeral: true,
        })
        const int = await interaction.channel.send({
            content: `${data.user1} & ${data.user2}`,
            embeds: [mainEmbed],
            components: [components],
        })

        const readyCollector = int.createMessageComponentCollector({
            time: 30_000,
        })

        readyCollector.on('collect', async (button) => {
            if (!button.isButton()) return // why lmao

            if (
                ![gamedata.user1.user.id, gamedata.user2.user.id].includes(
                    button.user.id
                )
            ) {
                return button.reply({
                    content: 'This is not for you.',
                    ephemeral: true,
                })
            }

            if (button.user.id === gamedata.user1.user.id) {
                if (gamedata.user1.ready) {
                    return button.reply({
                        content: 'You are already ready.',
                        ephemeral: true,
                    })
                }

                gamedata.user1.ready = true
                button.reply({
                    content: 'Waiting for opponent...',
                    ephemeral: true,
                })
            } else {
                if (gamedata.user2.ready) {
                    return button.reply({
                        content: 'You are already ready.',
                        ephemeral: true,
                    })
                }

                gamedata.user2.ready = true
                button.reply({
                    content: 'Waiting for opponent...',
                    ephemeral: true,
                })
            }

            if (gamedata.user1.ready && gamedata.user2.ready) {
                components = new MessageActionRow().addComponents([
                    new MessageButton()
                        .setLabel('READY')
                        .setStyle('SUCCESS')
                        .setCustomId('ready-sos')
                        .setDisabled(),
                ])
                await int.edit({
                    content: `${data.user1} & ${data.user2}`,
                    embeds: [mainEmbed],
                    components: [components],
                })
                const blnk = '<:blank:914473340129906708>'
                let sosBed = new MessageEmbed()
                    .setTitle('🤝 Split or Steal 💸')
                    .setDescription(
                        `**Rules**:\n${blnk}If both parties steal, its a tie!\n${blnk}If one steals and the other splits, the stealer keeps it all!\n${blnk}If both split, the reward gets split!\n\n**Reward**: ${data.prize}`
                    )
                    .setFooter('Good luck!')
                let newPonents = new MessageActionRow().addComponents([
                    new MessageButton()
                        .setEmoji('🤝')
                        .setLabel('Split')
                        .setStyle('PRIMARY')
                        .setCustomId('split-sos'),
                    new MessageButton()
                        .setEmoji('💸')
                        .setLabel('Steal')
                        .setStyle('PRIMARY')
                        .setCustomId('steal-sos'),
                ])
                let current
                const mainMessage = await interaction.channel.send({
                    content: `<@${gamedata.user1.user.id}> your turn!`,
                    embeds: [sosBed],
                    components: [newPonents],
                })
                current = gamedata.user1.user.id

                const sosCol = mainMessage.createMessageComponentCollector({
                    time: 30_000,
                })

                sosCol.on('collect', async (but) => {
                    if (
                        ![
                            gamedata.user1.user.id,
                            gamedata.user2.user.id,
                        ].includes(button.user.id)
                    ) {
                        return button.reply({
                            content: 'This is not for you.',
                            ephemeral: true,
                        })
                    }
                    if (current !== but.user.id) {
                        return button.reply({
                            content: 'Not your turn.',
                            ephemeral: true,
                        })
                    }

                    const user =
                        gamedata.user1.user.id == but.user.id
                            ? gamedata.user1
                            : gamedata.user2

                    const choice =
                        but.customId === 'steal-sos' ? 'steal' : 'split'

                    user.choice = choice
                    but.deferUpdate()
                    if (gamedata.user1.choice && gamedata.user2.choice) {
                        newPonents = new MessageActionRow().addComponents([
                            new MessageButton()
                                .setEmoji('🤝')
                                .setLabel('Split')
                                .setStyle('PRIMARY')
                                .setCustomId('split-sos')
                                .setDisabled(),
                            new MessageButton()
                                .setEmoji('💸')
                                .setLabel('Steal')
                                .setStyle('PRIMARY')
                                .setCustomId('steal-sos')
                                .setDisabled(),
                        ])
                        sosBed = new MessageEmbed()
                            .setTitle('🤝 Split or Steal 💸')
                            .setDescription(
                                `**The game is over and the choices have been made.**\n\n**${
                                    gamedata.user1.user.tag
                                }** chose to ${gamedata.user1.choice.toUpperCase()}!\n**${
                                    gamedata.user2.user.tag
                                }** chose to ${gamedata.user2.choice.toUpperCase()}!`
                            )
                            .setThumbnail()

                        return mainMessage.edit({
                            content: 'The game is over!',
                            embeds: [sosBed],
                            components: [newPonents],
                        })
                    } else {
                        mainMessage.edit({
                            content: `<@${gamedata.user2.user.id}> your turn!`,
                            embeds: [sosBed],
                            components: [newPonents],
                        })
                        current = gamedata.user2.user.id
                    }
                })
            }
        })
    },
}
