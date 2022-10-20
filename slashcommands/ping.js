const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check my round trip and Discord websocket latency.'),
    category: 'Utility',
    global: true,
    async execute(interaction) {
        const { client } = interaction

        try {
            await interaction.reply({ content: 'Pinging...' })

            const embed = new EmbedBuilder()
                .addFields(
                    {
                        name: 'Discord WebSocket',
                        value: `${client.ws.ping.toLocaleString()}ms`,
                    },
                    {
                        name: 'Round Trip',
                        value: `${(
                            Date.now() - interaction.createdTimestamp
                        ).toLocaleString()}ms`,
                    }
                )
                .setFooter({
                    text: client.user.tag,
                    iconURL:
                        client.user.displayAvatarURL({ dynamic: true }) ??
                        interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp()

            await interaction.editReply({
                content: '🏓 Pong!',
                embeds: [embed],
            })
        } catch (error) {
            console.error(error)
        }
    },
}
