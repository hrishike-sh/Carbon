const { Formatters, MessageEmbed, Client, Message } = require('discord.js')

module.exports = {
    name: 'whois',
    aliases: ['wi'],
    description: 'Shows mutual guilds with the bot and information about them.',
    usage: '[user]',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        try {
            const user =
                message.mentions.users.last() ||
                (await client.users.fetch(args[0]).catch(() => null)) ||
                client.users.cache.find(
                    (user) => user.username === args[0] || user.tag === args[0]
                ) ||
                message.author

            const Mutuals = []
            for await (const guild of client.guilds.cache) {
                try {
                    if (!(await guild.members.fetch(user.id))) {
                        continue
                    }
                } catch (e) {
                    continue
                }

                Mutuals.push(
                    `**${guild.name}** (\`${
                        guild.id
                    }\`) *${guild.memberCount.toLocaleString()} members*`
                )
            }
            const embed = new MessageEmbed()
                .setAuthor({
                    name: `${user.tag} - ${user.id}`,
                    iconURL: user.displayAvatarURL({ dynamic: true }),
                })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `Account was created ${client.functions.formatTime(
                        user.createdAt
                    )}(${client.functions.formatTime(
                        user.createdAt,
                        'd'
                    )})\n\n**__Mutual Servers__**\n${Mutuals.join('\n')}`
                )
                .setColor('RANDOM')

            return message.reply({
                embeds: [embed],
            })
        } catch (error) {
            console.error(error)
        }
    },
}
