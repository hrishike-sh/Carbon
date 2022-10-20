const { Guild, Client, EmbedBuilder } = require('discord.js')

module.exports = {
    name: 'guildDelete',
    once: false,
    /**
     *
     * @param {Guild} guild
     * @param {Client} client
     */
    async execute(guild, client) {
        if (!guild.available) return
        const channel = client.channels.cache.get('897100473184686110')

        channel.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: guild.name,
                        iconURL: guild.iconURL(),
                        url:
                            `https://discord.com/${guild.vanityURLCode}` ||
                            null,
                    })
                    .setTitle('Server Left')
                    .addField(
                        'Members',
                        guild.memberCount.toLocaleString(),
                        true
                    )
                    .addField(
                        'Owner',
                        (await client.users.fetch(guild.ownerId)).tag +
                            ` (${guild.ownerId})`,
                        true
                    )
                    .addField(
                        'Useless info',
                        `Guild was created ${client.functions.formatTime(
                            guild.createdAt
                        )}}`
                    )
                    .setColor('RED'),
            ],
        })
    },
}
