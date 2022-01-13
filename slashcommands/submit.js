const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    Message,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
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
        const link = interaction.options.getString('link')
        const reg = /\.(jpeg|jpg|gif|png)$/

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
                    footer: {
                        text: 'Use the buttons to proceed.',
                    },
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

            if (id === 'yes-submit') {
                return button.reply({
                    content: 'That worked lol, but it still didnt do stuff',
                })
            } else {
                return button.reply({
                    content: 'Okay, not doing that.',
                })
            }
        })
    },
}
