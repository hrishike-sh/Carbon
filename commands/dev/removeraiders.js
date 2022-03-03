const { Client, Message } = require('discord.js');
const ms = require('ms')

module.exports = {
    name: 'removeraiders',
    aliases: ['deleteraiders', 'fuckraid', 'HELPIMGETTINGRAIDEDAA'],
    category: 'Moderation',
    description:
        'Kicks all the new members who have joined in the last __x__ minutes/hours.',
    usage: '<time (1d, 5m, 3s, 1y)>',
        /**
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     * @returns
     */
    async execute(message, args, client) {
        if (!client.config.cmds.removeRaiders.includes(message.author.id))
            return
        if (!args[0])
            return message.channel.send('You have to provide valid time.')
        const time = ms(args[0])

        const msg = await message.channel.send('Fetching members...')
        try {
            await message.guild.members.fetch();
            await msg.delete();
        } catch (err) {
            await msg.edit(`There was an error while fetching members:\n${err.message}`)
            return;
        }
        const toKick = message.guild.members.cache.filter(
            (mem) => message.createdTimestamp - mem.joinedTimestamp < time
        )

        message.channel.send(
            `Are you sure you want to kick **${toKick.size.toLocaleString()}** members?\nReply with \`yes\` or \`no\``
        )
        const collector = message.channel.createMessageCollector({
            max: 1,
            filter: (msg) => msg.author.id === message.author.id,
        })

        collector.on('collect', async (message) => {
            if (message.content.toLowerCase() === 'yes') {
                let kicked = 0
                let failed = 0
                toKick.forEach((mem) => {
                        try {
                            mem.kick(
                                `Raider. Requested by ${message.author.tag}(${message.author.id})`
                            )
                            kicked++
                        } catch (e) {
                            failed++
                        }
                    })

                return message.channel.send(
                    `Done! Kicked a total of **${kicked.toLocaleString()}** members.\nFailed to kick **${failed.toLocaleString()}** members.`
                )
            } else {
                message.channel.send('Okay, wont kick those members.')
            }
        })
    },
}
