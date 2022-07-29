const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const Database = require('../database/models/settingsSchema')
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
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply(
                'You need `ADMINISTRATOR` permission to mess with this.'
            )
        }
        let server = await Database.findOne({
            guildID: interaction.guild.id,
        })
        if (!server) {
            server = new Database({
                guildID: interaction.guild.id,
            })
        }
        const group = interaction.options.getSubcommandGroup()
        if (group === 'manager-role') {
            const command = interaction.options.getSubcommand()
            if (!server.giveaway_config?.manager_roles) {
                server.giveaway_config.manager_roles = []
            }
            if (command == 'list') {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Manager Roles')
                            .setDescription(
                                'You can change these roles by using /gconfig!'
                            )
                            .addField(
                                'Roles',
                                server.giveaway_config.manager_roles
                                    .map((v, i) => `${i + 1}: <@&${v}>`)
                                    .join('\n') || 'None.'
                            ),
                    ],
                })
            }
        }
    },
}
