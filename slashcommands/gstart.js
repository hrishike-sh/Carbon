const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gstart')
        .setDescription('Start a giveaway!')
        .addStringOption((option) => {
            option
                .setName('time')
                .setDescription('Specify how long the giveaway should last')
                .setRequired(true)
        })
        .addNumberOption((option) => {
            option
                .setName('winners')
                .setDescription('Specify the amount of winners')
                .setRequired(true)
        })
        .addStringOption((option) => {
            option
                .setName('prize')
                .setDescription('Specify the prize for the giveaway')
                .setRequired(true)
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            prize: interaction.options.getString('prize'),
            winners: interaction.options.getNumber('winners'),
            time: interaction.options.getString('time'),
        }

        interaction.reply({
            content: `**Prize**: ${data.prize}\n**Winners**: ${data.winners}\n**Time**: ${data.time}`,
        })
    },
}
