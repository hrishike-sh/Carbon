const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, MessageEmbed } = require('discord.js')
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

        await interaction.reply({
            content: 'Test Submission',
            embeds: [
                {
                    title: 'This is how your submission will look.',
                    image: {
                        url: link,
                    },
                },
            ],
        })
    },
}
