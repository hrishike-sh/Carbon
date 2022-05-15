const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')
const Database = require('../database/models/fellowship')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fellowship')
        .setDescription('Manage fellowships')
        .addSubcommand((cmd) => {
            return cmd
                .setName('create')
                .setDescription('Create a new fellowship.')
                .addChannelOption((o) => {
                    return o
                        .addChannelType(0)
                        .setRequired(true)
                        .setName('channel')
                        .setDescription(
                            'The channel which you want to bind the fellowship with.'
                        )
                })
                .addUserOption((o) => {
                    return o
                        .setName('owner_1')
                        .setDescription('Owner 1 of the fellowship')
                        .setRequired(true)
                })
                .addNumberOption((n) => {
                    return n
                        .setName('owner_1_invites')
                        .setDescription('Number of invites Owner 1 has.')
                        .setRequired(true)
                })
                .addUserOption((o) => {
                    return o
                        .setName('owner_2')
                        .setDescription('Owner 2 of the fellowship')
                        .setRequired(true)
                })
                .addNumberOption((n) => {
                    return n
                        .setName('owner_2_invites')
                        .setDescription('Number of invites Owner 1 has.')
                        .setRequired(true)
                })
                .addUserOption((o) => {
                    return o
                        .setName('owner_3')
                        .setDescription('Owner 3 of the fellowship')
                        .setRequired(true)
                })
                .addNumberOption((n) => {
                    return n
                        .setName('owner_3_invites')
                        .setDescription('Number of invites Owner 1 has.')
                        .setRequired(true)
                })
        })
        .addSubcommand((cmd) => {
            return cmd
                .setName('add')
                .setDescription('Add someone to your fellowship.')
                .addChannelOption((c) => {
                    return c
                        .setName('fellowship')
                        .setDescription(
                            'Choose your fellowship channel (Fellowship Owners Only)'
                        )
                        .setRequired(true)
                })
                .addUserOption((o) => {
                    return o
                        .setName('user')
                        .setDescription('Mention the user you want to add.')
                        .setRequired(true)
                })
        })
        .addSubcommand((cmd) => {
            return cmd
                .setName('remove')
                .setDescription('Remove someone from your fellowship.')
                .addChannelOption((c) => {
                    return c
                        .setName('fellowship')
                        .setDescription(
                            'Choose your fellowship channel (Fellowship Owners Only)'
                        )
                        .setRequired(true)
                })
                .addUserOption((o) => {
                    return o
                        .setName('user')
                        .setDescription('Mention the user you want to remove.')
                        .setRequired(true)
                })
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const command = interaction.options.getSubcommand()

        if (command === 'create') {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.reply(
                    'Only admins can use this sub-command.'
                )
            }

            const data = {
                channel: interaction.options.getChannel('channel'),
                owner1: interaction.options.getUser('owner_1'),
                owner2: interaction.options.getUser('owner_2'),
                owner3: interaction.options.getUser('owner_3'),
                owner1Invites: interaction.options.getNumber('owner_1_invites'),
                owner2Invites: interaction.options.getNumber('owner_2_invites'),
                owner3Invites: interaction.options.getNumber('owner_3_invites'),
            }

            const exists = await Database.findOne({
                channelId: data.channel.id,
            })
            console.log(exists)
            if (exists) {
                return interaction.reply(
                    'A fellowship for that channel already exists!'
                )
            }
            new Database({
                guildId: interaction.guild.id,
                channelId: data.channel.id,
                ownerIds: [data.owner1.id, data.owner2.id, data.owner3.id],
                owners: {
                    one: {
                        userId: data.owner1.id,
                        invites: data.owner1Invites,
                        invited: [],
                    },
                    two: {
                        userId: data.owner2.id,
                        invites: data.owner2Invites,
                        invited: [],
                    },
                    three: {
                        userId: data.owner3.id,
                        invites: data.owner3Invites,
                        invited: [],
                    },
                },
            }).save()

            return interaction.reply(`☑ Fellowship has been created.`)
        } else if (command === 'add') {
            const data = {
                channel: interaction.options.getChannel('fellowship'),
                user: interaction.options.getUser('user'),
            }
            const fellowship = await Database.findOne({
                channelId: data.channel.id,
            })
            if (!fellowship)
                return interaction.reply({
                    content: "That's not even a valid fellowship.",
                })

            const owner = fellowship.ownerIds.includes(interaction.user.id)
            if (!owner)
                return interaction.reply(
                    'You are not an owner of that fellowship!'
                )

            const dbUser =
                fellowship.owners.one.userId == interaction.user.id
                    ? fellowship.owners.one
                    : fellowship.owners.two.userId == interaction.user.id
                    ? fellowship.owners.two
                    : fellowship.owners.three

            if (dbUser.invited.length == dbUser.invites) {
                return interaction.reply({
                    content: `You have already reached your max invites. (${dbUser.invites})`,
                })
            }
            if (dbUser.invited.includes(data.user.id))
                return interaction.reply(
                    'That user is already a part of your fellowship!'
                )
            dbUser.invited.push(data.user.id)
            await interaction.guild.channels.cache
                .get(fellowship.channelId)
                .permissionOverwrites.edit(data.user.id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                })
            fellowship.save()

            interaction.reply(
                `Done! Added ${data.user.toString()} to your fellowship ${data.channel.toString()}`
            )
        } else if (command === 'remove') {
            const data = {
                channel: interaction.options.getChannel('fellowship'),
                user: interaction.options.getUser('user'),
            }
            const fellowship = await Database.findOne({
                channelId: data.channel.id,
            })
            if (!fellowship)
                return interaction.reply({
                    content: "That's not even a valid fellowship.",
                })

            const owner = fellowship.ownerIds.includes(interaction.user.id)
            if (!owner)
                return interaction.reply(
                    'You are not an owner of that fellowship!'
                )

            const dbUser =
                fellowship.owners.one.userId == interaction.user.id
                    ? fellowship.owners.one
                    : fellowship.owners.two.userId == interaction.user.id
                    ? fellowship.owners.two
                    : fellowship.owners.three

            if (!dbUser.invited.includes(data.user.id))
                return interaction.reply(
                    'That user is not a part of your fellowship!'
                )
            dbUser.invited = dbUser.invited.filter((a) => a === data.user.id)
            await interaction.guild.channels.cache
                .get(fellowship.channelId)
                .permissionOverwrites.edit(data.user.id, {
                    VIEW_CHANNEL: false,
                    SEND_MESSAGES: false,
                })
            fellowship.save()

            interaction.reply(
                `Done! Removed ${data.user.toString()} from your fellowship ${data.channel.toString()}!`
            )
        }
    },
}
