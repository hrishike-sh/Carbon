const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const Database = require('../database/models/settingsSchema')
module.exports = {
    global: true,
    data: new SlashCommandBuilder()
        .setName('gconfig')
        .setDescription("Configure your server's giveaway settings!")
        .addSubcommand((c) => {
            return c
                .setName('view')
                .setDescription('View all your server configurations!')
        })
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
        })
        .addSubcommandGroup((group) => {
            return group
                .setName('blacklist-role')
                .setDescription(
                    "Add/Remove/View your server's giveaway blacklisted roles!"
                )
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('list')
                        .setDescription(
                            'Lists all the giveaway blacklisted roles.'
                        )
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('add')
                        .setDescription('Add a giveaway blacklist role.')
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
                        .setDescription('Remove a giveaway blacklist role.')
                        .addRoleOption((r) => {
                            return r
                                .setName('role')
                                .setDescription('The role you want to remove.')
                                .setRequired(true)
                        })
                })
        })
        .addSubcommandGroup((group) => {
            return group
                .setName('bypass-role')
                .setDescription(
                    "Add/Remove/View your server's giveaway bypass roles!"
                )
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('list')
                        .setDescription('Lists all the giveaway bypass roles.')
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('add')
                        .setDescription('Add a giveaway bypass role.')
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
                        .setDescription('Remove a giveaway bypass role.')
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

        if (interaction.options?.getSubcommand() ?? 'view') {
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(
                            `${interaction.guild.name}'s Giveaway Configurations`
                        )
                        .setDescription(
                            'These roles can be edited using /gconfig!'
                        )
                        .addField(
                            'Giveaway Manager Roles',
                            `**__Users with any of these roles can host giveaways__**:\n${server?.giveaway_config.manager_roles
                                .map((v, i) => `${i + 1}: <@&${v}>`)
                                .join('\n')}` || 'Nothing here.',
                            true
                        )
                        .addField(
                            'Blacklisted Roles',
                            `**__Users with any of these roles cannot join giveaways__**:\n${server?.giveaway_config.blacklisted_roles
                                .map((v, i) => `${i + 1}: <@&${v}>`)
                                .join('\n')}` || 'Nothing here.',
                            true
                        )
                        .addField(
                            'Bypass Roles',
                            `**__Users with any of these roles can bypass any giveaways hosted in the server__**:${server?.giveaway_config.bypass_roles
                                .map((v, i) => `${i + 1}: <@&${v}>`)
                                .join('\n')}` || 'Nothing here.',
                            true
                        ),
                ],
            })
        }
        const group = interaction.options?.getSubcommandGroup()

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
        } else if (group == 'blacklist-role') {
            const command = interaction.options.getSubcommand()
            if (!server.giveaway_config?.blacklisted_roles) {
                server.giveaway_config.blacklisted_roles = []
            }
            if (command == 'list') {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Blacklisted Roles')
                            .setDescription(
                                'You can change these roles by using /gconfig!'
                            )
                            .addField(
                                'Roles',
                                server.giveaway_config.blacklisted_roles
                                    .map((v, i) => `${i + 1}: <@&${v}>`)
                                    .join('\n') || 'None.'
                            )
                            .setColor('RANDOM'),
                    ],
                })
            } else if (command == 'add') {
                const role = interaction.options.getRole('role')

                if (
                    server.giveaway_config.blacklisted_roles.includes(role.id)
                ) {
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
                server.giveaway_config.blacklisted_roles.push(role.id)
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Blacklisted Role')
                            .setDescription(
                                `Added ${role.toString()} to the list!`
                            )
                            .setColor('GREEN')
                            .setFooter({
                                text: 'You can check the list via /gconfig blacklist-role list',
                            }),
                    ],
                })
            } else if (command == 'remove') {
                const role = interaction.options.getRole('role')

                if (
                    !server.giveaway_config.blacklisted_roles.includes(role.id)
                ) {
                    return interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(
                                    `${role.toString()} is not a giveaway blacklisted role.`
                                )
                                .setColor('RED'),
                        ],
                    })
                }
                server.giveaway_config.blacklisted_roles =
                    server.giveaway_config.blacklisted_roles.filter(
                        (r) => r !== role.id
                    )
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Blacklist Role')
                            .setDescription(
                                `Removed ${role.toString()} from the list!`
                            )
                            .setColor('RED')
                            .setFooter({
                                text: 'You can check the list via /gconfig blacklist-role list',
                            }),
                    ],
                })
            }
        } else if (group == 'bypass-role') {
            const command = interaction.options.getSubcommand()
            if (!server.giveaway_config?.bypass_roles) {
                server.giveaway_config.bypass_roles = []
            }
            if (command == 'list') {
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Bypass Roles')
                            .setDescription(
                                'You can change these roles by using /gconfig!'
                            )
                            .addField(
                                'Roles',
                                server.giveaway_config.bypass_roles
                                    .map((v, i) => `${i + 1}: <@&${v}>`)
                                    .join('\n') || 'None.'
                            )
                            .setColor('RANDOM'),
                    ],
                })
            } else if (command == 'add') {
                const role = interaction.options.getRole('role')

                if (server.giveaway_config.bypass_roles.includes(role.id)) {
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
                server.giveaway_config.bypass_roles.push(role.id)
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Bypass Role')
                            .setDescription(
                                `Added ${role.toString()} to the list!`
                            )
                            .setColor('GREEN')
                            .setFooter({
                                text: 'You can check the list via /gconfig bypass-role list',
                            }),
                    ],
                })
            } else if (command == 'remove') {
                const role = interaction.options.getRole('role')

                if (!server.giveaway_config.bypass_roles.includes(role.id)) {
                    return interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(
                                    `${role.toString()} is not a giveaway bypass role.`
                                )
                                .setColor('RED'),
                        ],
                    })
                }
                server.giveaway_config.bypass_roles =
                    server.giveaway_config.bypass_roles.filter(
                        (r) => r !== role.id
                    )
                server.save()

                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Giveaway Bypass Role')
                            .setDescription(
                                `Removed ${role.toString()} from the list!`
                            )
                            .setColor('RED')
                            .setFooter({
                                text: 'You can check the list via /gconfig bypass-role list',
                            }),
                    ],
                })
            }
        }
    },
}
