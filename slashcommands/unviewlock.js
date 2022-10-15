const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    Client,
    TextChannel,
} = require('discord.js')

module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('unviewlock')
        .setDescription('Unviewlock a channel for a user or role or everyone.')
        .addChannelOption((option) => {
            return option
                .setName('channel')
                .setDescription('The channel you want to unviewlock')
                .setRequired(true)
        })
        .addUserOption((opt) => {
            return opt
                .setName('user')
                .setDescription(
                    'The user you want to unviewlock for the channel you have selected'
                )
                .setRequired(false)
        })
        .addRoleOption((opt) => {
            return opt
                .setName('role')
                .setDescription(
                    'The role you want to unviewlock for the channel you have selected'
                )
                .setRequired(false)
        }),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const data = {
            channel: interaction.options.getChannel('channel'),
            user: interaction.options.getUser('user') || null,
            role: interaction.options.getRole('role') || null,
        }
        const yes = ['824348974449819658' , '1016728636365209631']
        if (!interaction.member.roles.cache.hasAny(...yes)) {
            return interaction.reply({
                content: `You must have the role <@&1016728636365209631> to run the command`,
                ephemeral: true,
            })
        }

        const channel = data.channel
        if (channel.type !== 'GUILD_TEXT')
            return interaction.reply({
                content: 'Make sure it is a text channel.',
            })

        try {
            if (data.user) {
                channel.permissionOverwrites.edit(data.user.id, {
                    VIEW_CHANNEL: true,
                })

                return interaction.reply({
                    content: `${channel.toString()} has been unviewlocked for ${data.user.toString()}!`,
                })
            } else if (data.role) {
                channel.permissionOverwrites.edit(data.role.id, {
                    VIEW_CHANNEL: true,
                })

                return interaction.reply({
                    content: `${channel.toString()} has been unviewlocked for role \`${
                        data.role.name
                    }\`.`,
                })
            } else {
                channel.permissionOverwrites.edit(
                    channel.guild.roles.everyone,
                    {
                        VIEW_CHANNEL: true,
                    }
                )

                return interaction.reply({
                    content: `${channel.toString()} is now unviewlocked for \`@everyone\`.`,
                })
            }
        } catch (e) {
            return interaction.reply({
                content: `An error occured!\n\n${e.message}`,
            })
        }
    },
}
