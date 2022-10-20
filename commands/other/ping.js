const { EmbedBuilder } = require('discord.js')

module.exports = {
    name: 'ping',
    aliases: ['ut', 'uptime'],
    category: 'Other',
    description: 'Bot Uptime and ping',
    async execute(message, args, client) {
        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `Latency: ${
                            client.ws.ping
                        }ms\nUptime: ${client.functions.formatTime(
                            client.readyAt
                        )}`
                    )
                    .setFooter({
                        text: `The message took ${(
                            Date.now() - message.createdTimestamp
                        ).toLocaleString()}ms to send.`,
                        iconURL:
                            client.user.displayAvatarURL({ dynamic: true }) ??
                            client.user.displayAvatarURL({
                                dynamic: true,
                            }),
                    })
                    .setTimestamp(),
            ],
        })
    },
}
