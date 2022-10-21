const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('middleman')
        .setDescription('Request a middleman!')
        .addChannelOption((opt) => {
            return opt
                .addChannelType(0)
                .setName('channel')
                .setRequired(true)
                .setDescription('The channel you require middleman in.')
        }),
    category: 'Utility',
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel')
        const guildChannel = interaction.guild.channels.cache.get(channel.id)

        if (!guildChannel) {
            return interaction.reply({
                content: "Couldn't find that channel.",
            })
        }
        if (interaction.channel.id !== '824882245490835477') {
            return interaction.reply({
                content: 'This can only be used in <#824882245490835477>',
            })
        }

        interaction.reply({
            content: 'Middleman request sent!',
            ephemeral: true,
        })
        const msg = await interaction.channel.send({
            content: `<@&824329689534431302> ${guildChannel.toString()}`,
            embeds: [
                {
                    title: 'Middleman Request! 🙋‍♂️',
                    color: 'Yellow',
                    description: `${interaction.user.toString()} requests for a middleman in ${guildChannel.toString()}!`,
                    footer: {
                        text: 'This can be accepted within 5 minutes.',
                    },
                },
            ],
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('mm-accept'),
                ]),
            ],
            allowedMentions: {
                parse: ['roles'],
            },
        })

        const collector = msg.createMessageComponentCollector({
            filter: (b) => {
                if (!b.member.roles.cache.has('824329689534431302')) {
                    return b.reply({
                        content: `You need to have the <@&824329689534431302> to accept this!`,
                        ephemeral: true,
                    })
                } else return true
            },
            idle: 5 * 60 * 1000,
        })
        collector.on('collect', async (button) => {
            button.reply({
                content: `${button.user.toString()} Please check ${channel.toString()}`,
            })
            collector.stop()
            channel.send(
                `${interaction.user.toString()} your middleman has arrived! Please send your stuff to ${button.user.toString()}`
            )
        })

        collector.on('end', () => {
            msg.components[0].components.forEach((c) => {
                c.setDisabled()
            })
            msg.edit({
                components: msg.components,
            })
        })
    },
}
