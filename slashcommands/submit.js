const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    Message,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const db = require('../database/models/submissionSchema')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit your submission for the Event!')
        .addStringOption((opt) => {
            return opt
                .setName('link')
                .setDescription(
                    'Upload your submission to an image host and provide the link here.'
                )
                .setRequired(true)
        }),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const submissionsChannel = '924850616411504710'
        const link = interaction.options.getString('link')
        const reg = /\.(jpeg|jpg|gif|png)$/
        let dbUser = await db.findOne({
            userId: interaction.user.id,
        })
        const all = await db.length
        if (dbUser) {
            if (dbUser.cooldown > new Date().getTime()) {
                return interaction.reply({
                    content: `${interaction.user.toString()} you can only submit **1** per **15 minutes**.\nYou can post again in \`${require('ms')(
                        dbUser.cooldown - new Date().getTime(),
                        { long: true }
                    )}\``,
                })
            }
        } else {
            dbUser = new db({
                userId: interaction.user.id,
                votes: {
                    upvotes: 0,
                    downvotes: 0,
                    netVotes: 0,
                },
            })
        }
        if (!link.match(reg)) {
            return interaction.reply({
                content: 'No valid link was provided.',
            })
        }
        const row = new MessageActionRow().addComponents([
            new MessageButton()
                .setLabel('Confirm')
                .setStyle('SUCCESS')
                .setCustomId('yes-submit'),
            new MessageButton()
                .setLabel('No, go back.')
                .setStyle('DANGER')
                .setCustomId('no-submit'),
        ])
        interaction.reply({
            content: 'Yes, check channel.',
            ephemeral: true,
        })
        const message = await interaction.channel.send({
            content: 'Are you sure you want to submit this?',
            embeds: [
                {
                    title: `Submission by ${interaction.user.tag}`,
                    image: {
                        url: link,
                    },
                },
            ],
            components: [row],
        })

        const confirmationCollector = message.createMessageComponentCollector({
            time: 30000,
        })

        confirmationCollector.on('collect', async (button) => {
            if (!button.isButton()) return // this isnt even required but ok

            const id = button.customId
            if (button.user.id !== interaction.user.id) {
                return button.reply({
                    content: 'This is not for you.',
                    ephemeral: true,
                })
            }

            row.components.forEach((but) => {
                but.setDisabled()
            })
            message.edit({
                components: [row],
            })
            if (id === 'yes-submit') {
                const embed = new MessageEmbed()
                    .setAuthor({
                        iconURL: interaction.user.displayAvatarURL(),
                        name: interaction.user.tag,
                    })
                    .setFooter(`ID: ${interaction.user.id}`)
                    .setImage(link)
                    .setColor('YELLOW')

                dbUser.submittedAt = new Date().getTime()
                dbUser.url = link
                dbUser.cooldown = new Date().getTime() + require('ms')('15m')
                dbUser.number = all
                dbUser.voted = []
                dbUser.save()

                interaction.client.channels.cache.get(submissionsChannel).send({
                    embeds: [embed],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setLabel('Accept')
                                .setCustomId('accept-submit')
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setStyle('DANGER')
                                .setLabel('Deny')
                                .setCustomId('deny-submit'),
                        ]),
                    ],
                })
                return button.reply({
                    content:
                        'Done! Your submission is submitted and you will get a DM when it is accepted or denied.',
                })
            } else {
                return button.reply({
                    content: 'Okay, not doing that.',
                })
            }
        })
    },
}
