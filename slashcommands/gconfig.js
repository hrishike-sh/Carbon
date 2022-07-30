const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const Database = require('../database/models/settingsSchema')
module.exports = {
    global: true,
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
                            )
                            .setColor('RANDOM'),
                    ],
                })
            } else if (command == 'add') {
                const role = interaction.options.getRole('role')

                if (server.giveaway_config.manager_roles.includes(role.id)) {
                    return interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(
                                    `${role.toString()} is already in the list.`
                                )
                                .setColor('RED'),
                        ],
                    })
                }
                server.giveaway_config.manager_roles.push(role.id)
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Manager Role')
                            .setDescription(
                                `Added ${role.toString()} to the list!`
                            )
                            .setColor('GREEN')
                            .setFooter({
                                text: 'You can check the list via /gconfig manager-role list',
                            }),
                    ],
                })
            } else if (command == 'remove') {
                const role = interaction.options.getRole('role')

                if (!server.giveaway_config.manager_roles.includes(role.id)) {
                    return interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(
                                    `${role.toString()} is not a giveaway manager role.`
                                )
                                .setColor('RED'),
                        ],
                    })
                }
                server.giveaway_config.manager_roles =
                    server.giveaway_config.manager_roles.filter(
                        (r) => r !== role.id
                    )
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Manager Role')
                            .setDescription(
                                `Removed ${role.toString()} from the list!`
                            )
                            .setColor('RED')
                            .setFooter({
                                text: 'You can check the list via /gconfig manager-role list',
                            }),
                    ],
                })
            }
        }
    },
}