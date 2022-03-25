const { SlashCommandBuilder } = require('@discordjs/builders')
const { Interaction } = require('discord.js')
module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('See if the bot is alive.'),
    /**
     *
     * @param {Interaction} interaction
     */
    async execute(interaction) {
        return interaction.reply('Pong!')
    },
}
