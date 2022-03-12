const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('censor')
        .setDescription('Configure the censors for your server.')
        .addSubcommand((cmd) => {
            cmd.setName('add')
                .setDescription('Add a new censor.')
                .addStringOption((opt) => {
                    opt.setName('censor')
                        .setDescription('The trigger for the censor.')
                        .setRequired(true)
                })
                .addStringOption((opt) => {
                    opt.setName('censor-regex')
                        .setDescription(
                            'The trigger you want to add, but takes input as regex.'
                        )
                        .setRequired(false)
                })
        })
        .addSubcommand((cmd) => {
            cmd.setName('remove')
                .setDescription('Remove a censor.')
                .addStringOption((opt) => {
                    opt.setName('id')
                        .setDescription(
                            'The ID of the censor. (ID can be found in /censor list)'
                        )
                        .setRequired(true)
                })
        })
        .addSubcommand((cmd) => {
            cmd.setName('list').setDescription('List of all the censors.')
        }),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const command = interaction.options.getSubcommand(true)

        return interaction.reply(`Command: ${command.toString()}`)
    },
}
