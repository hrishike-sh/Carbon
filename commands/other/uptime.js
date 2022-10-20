const { EmbedBuilder } = require('discord.js')

module.exports = {
    name: 'ping',
    aliases: ['ut', 'uptime'],
    description: 'Bot Uptime and ping',
    async execute(message, args, client) {
        const uptime = (new Date() / 1000 - client.uptime / 1000).toFixed()

        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Pong 🏓')
                    .setDescription(
                        `**Client latency:** ${client.ws.ping}ms\nUp since <t:${uptime}:R>`
                    ),
            ],
        })
    },
}
