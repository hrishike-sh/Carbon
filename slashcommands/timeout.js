const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .addUserOption((amogus) => {
            return amogus
                .setName('user')
                .setDescription('The user you want to timeout.')
                .setRequired('True')
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
    permissions: '',
    async execute(interaction) {},
}
