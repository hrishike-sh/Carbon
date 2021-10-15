module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild, client){
        const logChannel = client.channels.cache.get("897100473184686110")
        logChannel.send({
            embed: {
                title: 'New Server Joined',
                thumbnail: {
                    url: guild.iconURL({ dynamic: true })
                },
                color: 'GREEN',
                fields: [
                    {
                        name: 'Total Members',
                        value: guild.memberCount.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Owner info',
                        value: `Tag: \`${guild.owner.user.tag}\`\nID: ${guild.owner.user.id}`,
                        inline: true
                    },
                    {
                        name: 'Joined at',
                        value: `<t:${(guild.joinedTimestamp / 1000).toFixed(0)}:R>`
                    }
                ]
            }
        })
    }
}