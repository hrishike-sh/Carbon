const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gconfig')
        .setDescription("Configure your server's giveaway settings!")
        .addSubcommandGroup((group) => {
            return group
                .setName('manager-role')
                .setDescription(
                    "Add/Remove/View your server's giveaway manager roles!"
                )
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('list')
                        .setDescription('Lists all the giveaway manager roles.')
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('add')
                        .setDescription('Add a manager role.')
                        .addRoleOption((r) => {
                            return r
                                .setName('role')
                                .setDescription('The role you want to add.')
                                .setRequired(true)
                        })
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('remove')
                        .setDescription('Remove a manager role.')
                        .addRoleOption((r) => {
                            return r
                                .setName('role')
                                .setDescription('The role you want to remove.')
                                .setRequired(true)
                        })
                })
        }),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        return interaction.reply(
            `Group: ${interaction.options.getSubcommandGroup()}\nCommand: ${interaction.options.getSubcommand()}`
        )
    },
}
