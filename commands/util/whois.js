module.exports = {
    name: 'whois',
    aliases: ['wi'],
    usage: 'user_id',
    description: 'Shows mutuals and userinfo about a certain user.',
    async execute(message, args, client) {
        let userid =
            message.mentions.users.size > 0
                ? message.mentions.users.first().id
                : args[0]

        if (!userid) userid = message.author.id
        if (!client.users.cache.get(userid))
            return message.channel.send(`The user_id was not found.`)

        let results = ''
        client.guilds.cache.forEach((guild) => {
            if (guild.members.cache.has(userid))
                results += `(\`${guild.id}\`) - **${guild.name}**\n`
        })
        message.channel.send({
            embeds: [
                {
                    author: {
                        name:
                            '| ' +
                            client.users.cache.get(userid).tag +
                            ` -- ${userid}`,
                        icon_url: client.users.cache
                            .get(userid)
                            .displayAvatarURL({ dynamic: false }),
                    },
                    description: `**Mutual Servers**\n` + results,
                    color: 'RANDOM',
                    thumbnail: {
                        url: client.users.cache
                            .get(userid)
                            .displayAvatarURL({ dynamic: true }),
                    },
                },
            ],
        })
    },
}
