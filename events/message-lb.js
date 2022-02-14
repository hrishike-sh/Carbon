const { Message, Client, Collection } = require('discord.js')
const pings = require('../database/models/ping')
module.exports = {
    name: 'messageCreate',
    /**
     *
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        if (message.author.bot) return
        if (message.guild.id !== '824294231447044197') return

        if (message.mentions.members.size < 1) return
        message.mentions.members.forEach(async (member) => {
            if (
                member.roles.cache.hasAny(
                    '826197829126979635',
                    '824687526396297226',
                    '825965323500126208',
                    '828048225096826890'
                )
            ) {
                let user = await pings.findOne({ userId: member.id })
                if (!user) {
                    user = new pings({
                        userId: member.id,
                        pings: [],
                    })
                }

                user.pings.push({
                    when: new Date().getTime(),
                    content: message.content,
                    message_link: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
                    author: message.author,
                    channel: message.channel.id,
                })
                user.save()
            } else return
        })
    },
}
