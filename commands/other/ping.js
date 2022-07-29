const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'ping',
    aliases: ['ut', 'uptime'],
    category: 'Other',
    description: 'Bot Uptime and ping',
    async execute(message, args, client) {
        const uptime = (new Date() / 1000 - client.uptime / 1000).toFixed()

        await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(
                        `Latency: ${
                            client.ws.ping
                        }ms\nUptime: ${client.functions.formatTime(uptime)}`
                    )
                    .setFooter({
                        text: `The message took ${(
                            Date.now() - interaction.createdTimestamp
                        ).toLocaleString()}ms to send.`,
                        iconURL:
                            client.user.displayAvatarURL({ dynamic: true }) ??
                            interaction.user.displayAvatarURL({
                                dynamic: true,
                            }),
                    })
                    .setTimestamp(),
            ],
        })
    },
}
