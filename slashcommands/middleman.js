const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')

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
    catehory: 'Utility',
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
            content: `<@&824329689534431302> ${guildChannel.toString()}`,
            embeds: [
                {
                    title: 'Middleman Request! 🙋‍♂️',
                    color: 'YELLOW',
                    description: `${interaction.user.toString()} requests for a middleman in ${guildChannel.toString()}!`,
                },
            ],
            allowedMentions: {
                repliedUser: false,
                parse: ['roles'],
            },
        })
    },
}
