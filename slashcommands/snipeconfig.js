const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, EmbedBuilder } = require('discord.js')
const SETTINGS = require('../database/models/settingsSchema')
module.exports = {
    global: true,
    data: new SlashCommandBuilder()
        .setName('snipe-config')
        .setDescription('Configure the snipe settings for your server!')
        .addSubcommandGroup((group) => {
            return group
                .setName('allowed-role')
                .setDescription('Roles which can use the snipe command!')
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('list')
                        .setDescription(
                            'View all the roles that can run the `fh snipe` and `fh esnipe` command.'
                        )
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('add')
                        .setDescription('Add a role.')
                        .addRoleOption((o) => {
                            return o
                                .setName('role')
                                .setDescription('The role you want to add.')
                        })
                })
                .addSubcommand((cmd) => {
                    return cmd
                        .setName('remove')
                        .setDescription('Remove a role.')
                        .addRoleOption((o) => {
                            return o
                                .setName('role')
                                .setDescription('The role you want to remove.')
                        })
                })
        })
        .addSubcommand((g) => {
            return g
                .setName('toggle')
                .setDescription(
                    'Turn off/on snipes and esnipes in your server.'
                )
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply(
                'You need the `ADMINISTRATOR` permission to run this command.'
            )
        }
        let server = await SETTINGS.findOne({
            guildID: interaction.guild.id,
        })
        if (!server) {
            server = new SETTINGS({
                guildID: interaction.guild.id,
            })
        }
        if (interaction?.options.getSubcommand() == 'toggle') {
            if (server.snipe_config?.enabled) {
                server.snipe_config.enabled = false
            } else {
                server.snipe_config.enabled = true
            }
            server.save()

            return interaction.reply(
                `Snipes are now **${
                    server.snipe_config.enabled ? 'enabled' : 'disabled'
                }** for this server.`
            )
        }

        const group = interaction.options?.getSubcommandGroup()

        if (group === 'allowed-role') {
            const command = interaction.options.getSubcommand()
            if (!server.snipe_config?.allowed_roles) {
                server.snipe_config.allowed_roles = []
            }
            if (command == 'list') {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Snipe Whitelist Roles')
                            .setDescription(
                                'You can change these roles by using /snipe-config!'
                            )
                            .addFields(
                                'Roles',
                                server.snipe_config.allowed_roles
                                    .map((v, i) => `${i + 1}: <@&${v}>`)
                                    .join('\n') || 'None.'
                            )
                            .setColor('Random'),
                    ],
                })
            } else if (command == 'add') {
                const role = interaction.options.getRole('role')

                if (server.snipe_config.allowed_roles.includes(role.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${role.toString()} is already in the list.`
                                )
                                .setColor('Red'),
                        ],
                    })
                }
                server.snipe_config.allowed_roles.push(role.id)
                server.save()

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Snipe Whitelist Role')
                            .setDescription(
                                `Added ${role.toString()} to the list!`
                            )
                            .setColor('Green')
                            .setFooter({
                                text: 'You can check the list via /snipe-config allowed-role list',
                            }),
                    ],
                })
            } else if (command == 'remove') {
                const role = interaction.options.getRole('role')

                if (!server.snipe_config.allowed_roles.includes(role.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${role.toString()} is not a Snipe Whitelisted role.`
                                )
                                .setColor('Red'),
                        ],
                    })
                }
                server.snipe_config.allowed_roles =
                    server.snipe_config.allowed_roles.filter(
                        (r) => r !== role.id
                    )
                server.save()

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Snipe Whitelist Role')
                            .setDescription(
                                `Removed ${role.toString()} from the list!`
                            )
                            .setColor('Red')
                            .setFooter({
                                text: 'You can check the list via /snipe-config allowed-role list',
                            }),
                    ],
                })
            }
        }
    },
}
