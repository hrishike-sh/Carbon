const Messages = require('discord-messages')
const Heists = require('../../functions/heist-dono')
const Grinds = require('../../functions/grind-dono')
const Special = require('../../functions/another-dono-thing-whyy')
const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    Message,
    ButtonStyle,
} = require('discord.js')

module.exports = {
    name: 'mydono',
    aliases: ['myd'],
    description: 'Check your donations',
    usage: '[user]',
    usage: 'myd',
    category: 'Donation',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @returns
     */
    async execute(message, args) {
        let target = message.mentions.users.first() || message.author
        const mainMessage = await message.channel.send({
            embeds: [
                {
                    description: 'Fetching database...',
                },
            ],
        })
        let user = await Messages.fetch(target.id, message.guild.id, true)
        let user2 = await Heists.fetch(target.id, message.guild.id, true)
        let user3 = await Grinds.fetch(target.id, message.guild.id, true)
        let user4 = await Special.fetch(target.id, message.guild.id, true)
        if (!user && !user2 && !user3 && !user4)
            return mainMessage.edit({
                embeds: [
                    {
                        description:
                            'Either the target has not donated any amount OR your donations are yet to be counted!',
                    },
                ],
            })
        let donationAmount = {
            amount: user.data ? user.data.messages : 0,
            position: user.position || 0,
        }
        let heistAmount = {
            amount: user2.data ? user2.data.amount : 0,
            position: user2.position || 0,
        }
        let grindAmount = {
            amount: user3.data ? user3.data.amount : 0,
            position: user3.position || 0,
        }
        let specialAmount = {
            amount: user4.data ? user4.data.amount : 0,
            position: user4.position || 0,
        }
        const totalAmount =
            grindAmount.amount +
            donationAmount.amount +
            heistAmount.amount +
            specialAmount.amount

        let buttonD = new ButtonBuilder()
            .setLabel('Donations')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('myd-d')

        let buttonH = new ButtonBuilder()
            .setLabel('Heist Donations')
            .setCustomId('myd-h')
            .setStyle(ButtonStyle.Secondary)

        let buttonG = new ButtonBuilder()
            .setLabel('Grinder Donations')
            .setCustomId('myd-g')
            .setStyle(ButtonStyle.Secondary)

        let buttonS = new ButtonBuilder()
            .setLabel('FF Donations')
            .setCustomId('myd-s')
            .setStyle(ButtonStyle.Secondary)

        let row = new ActionRowBuilder().addComponents([
            buttonD,
            buttonH,
            buttonG,
            buttonS,
        ])

        let dataForD = {
            embed: {
                title: 'Donations ~ Regular',
                description: `Donations from <@${
                    target.id
                }>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: 'Donated: ',
                        value: `${donationAmount.amount.toLocaleString()} coins.`,
                    },
                    {
                        name: 'Position: ',
                        value: `${donationAmount.position.toLocaleString()}.`,
                    },
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1',
                },
                footer: {
                    text: 'Thank you for donating!',
                },
                timestamp: new Date(),
            },
            components: [row],
        }
        let dataForH = {
            embed: {
                title: 'Donations ~ Heists',
                description: `Donations from <@${
                    target.id
                }>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: 'Donated: ',
                        value: `${heistAmount.amount.toLocaleString()} coins.`,
                    },
                    {
                        name: 'Position: ',
                        value: `${heistAmount.position.toLocaleString()}.`,
                    },
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1',
                },
                footer: {
                    text: 'Thank you for donating!',
                },
                timestamp: new Date(),
            },
            components: [row],
        }
        let dataForG = {
            embed: {
                title: 'Donations ~ Grinders',
                description: `Donations from <@${
                    target.id
                }>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: 'Donated: ',
                        value: `${grindAmount.amount.toLocaleString()} coins.`,
                    },
                    {
                        name: 'Position: ',
                        value: `${grindAmount.position.toLocaleString()}.`,
                    },
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1',
                },
                footer: {
                    text: 'Thank you for donating!',
                },
                timestamp: new Date(),
            },
            components: [row],
        }
        let dataForS = {
            embed: {
                title: 'Donations ~ FF Dono',
                description: `Donations from <@${
                    target.id
                }>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: 'Donated: ',
                        value: `${specialAmount.amount.toLocaleString()} coins.`,
                    },
                    {
                        name: 'Position: ',
                        value: `${specialAmount.position.toLocaleString()}.`,
                    },
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1',
                },
                footer: {
                    text: 'Thank you for donating!',
                },
                timestamp: new Date(),
            },
            components: [row],
        }

        mainMessage.delete()
        const newMessage = await message.channel.send({
            embeds: [dataForD.embed],
            components: dataForD.components,
            content:
                'If your donations are not yet counted, please contact a moderator.',
        })

        const collector = newMessage.createMessageComponentCollector((b) => b, {
            time: 30000,
        })

        collector.on('collect', async (button) => {
            if (button.user.id !== message.author.id) {
                button.reply({
                    content: 'This is not for you.',
                    ephemeral: true,
                })
                return
            }

            if (button.customId === 'myd-d') {
                buttonD = buttonD.setStyle(ButtonStyle.Success).setDisabled()

                buttonH = buttonH
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonG = buttonG
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonS = buttonS
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)

                row = new ActionRowBuilder().addComponents([
                    buttonD,
                    buttonH,
                    buttonG,
                    buttonS,
                ])
                dataForD.components = [row]
                newMessage.edit({
                    embeds: [dataForD.embed],
                    components: dataForD.components,
                })
                button.deferUpdate()
            } else if (button.customId === 'myd-h') {
                buttonH = buttonH.setStyle(ButtonStyle.Success).setDisabled()

                buttonD = buttonD
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonG = buttonG
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonS = buttonS
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)

                row = new ActionRowBuilder().addComponents([
                    buttonD,
                    buttonH,
                    buttonG,
                    buttonS,
                ])
                dataForH.components = [row]

                newMessage.edit({
                    embeds: [dataForH.embed],
                    components: dataForH.components,
                })
                button.deferUpdate()
            } else if (button.customId === 'myd-g') {
                buttonG = buttonG.setStyle(ButtonStyle.Success).setDisabled()

                buttonD = buttonD
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonH = buttonH
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonS = buttonS
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)

                row = new ActionRowBuilder().addComponents([
                    buttonD,
                    buttonH,
                    buttonG,
                    buttonS,
                ])
                dataForG.components = [row]

                newMessage.edit({
                    embeds: [dataForG.embed],
                    components: dataForG.components,
                })
                button.deferUpdate()
            } else if (button.customId === 'myd-s') {
                buttonS = buttonS.setStyle(ButtonStyle.Success).setDisabled()

                buttonD = buttonD
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonG = buttonG
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)
                buttonH = buttonH
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(false)

                row = new ActionRowBuilder().addComponents([
                    buttonD,
                    buttonH,
                    buttonG,
                    buttonS,
                ])
                dataForS.components = [row]

                newMessage.edit({
                    embeds: [dataForS.embed],
                    components: dataForS.components,
                })
                button.deferUpdate()
            } else;
        })

        collector.on('end', () => {
            buttonS = buttonS.setStyle(ButtonStyle.Secondary).setDisabled()
            buttonD = buttonD.setStyle(ButtonStyle.Secondary).setDisabled()
            buttonG = buttonG.setStyle(ButtonStyle.Secondary).setDisabled()
            buttonH = buttonH.setStyle(ButtonStyle.Secondary).setDisabled()

            row = new ActionRowBuilder().addComponents([
                buttonD,
                buttonH,
                buttonG,
                buttonS,
            ])

            newMessage.edit({
                content: 'This message is now inactive.',
                embeds: [dataForD.embed],
                components: [row],
            })
        })
    },
}
