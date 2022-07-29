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
                    .addFields(
                        {
                            name: 'Discord WebSocket',
                            value: `${client.ws.ping.toLocaleString()}ms`,
                            inline: true,
                        },
                        {
                            name: 'Round Trip',
                            value: `${(
                                Date.now() - message.createdTimestamp
                            ).toLocaleString()}ms`,
                            inline: true,
                        }
                    )
                    .setFooter({
                        text: client.user.tag,
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
