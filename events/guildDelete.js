module.exports = {
    name: 'guildDelete',
    once: false,
    async execute(guild, client) {
        const logChannel = client.channels.cache.get('897100473184686110')
        logChannel.send({
            embed: {
                title: 'Server Left',
                thumbnail: {
                    url: guild.iconURL({ dynamic: true }),
                },
                color: 'RED',
                fields: [
                    {
                        name: 'Total Members',
                        value: guild.memberCount.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: 'Owner info',
                        value: `Tag: \`${guild.owner.user.tag}\`\nID: ${guild.owner.user.id}`,
                        inline: true,
                    },
                    {
                        name: 'Joined at',
                        value: `<t:${(
                            new Date() / 1000 -
                            guild.joinedTimestamp / 1000
                        ).toFixed(0)}>`,
                    },
                ],
            },
        })
    },
}
