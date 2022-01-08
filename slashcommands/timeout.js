const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Time someone out.')
        .addUserOption((amogus) => {
            return amogus
                .setName('user')
                .setDescription('The user you want to timeout.')
                .setRequired(true)
        })
        .addStringOption((sus) => {
            return sus
                .setDescription('Reason for the timeout.')
                .setName('reason')
                .setRequired(true)
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    permissions: 'MODERATE_MEMBERS',
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.reply({
            content: 'HmMmMM',
            ephemeral: true,
        })
    },
}
