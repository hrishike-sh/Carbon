const { Client, Message, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'unban',
    aliases: ['ub'],
    fhOnly: false,
    usage: '<USER_ID> <REASON>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (message.guild.id !== '845215901657071647') return
        if (
            !message.member.roles.cache.has('848576301182877727') &&
            !message.member.roles.cache.has('848580138970251314')
        )
            return

        const fh = client.guilds.cache.get('824294231447044197')
        if (!args[0]) return message.reply('Either ping or give me the id.')
        const user =
            message.mentions.users.first() ||
            (await client.users.fetch(args[0]))

        if (!user) return message.reply('Please provide a valid user id.')
        args.shift()
        const reason = args.join(' ')
        if (!reason)
            return message.reply(
                'You also need to provide a reason for the unban.'
            )
        const banned = await fh.bans
            .fetch(user.id, { cache: true })
            .catch((e) => {
                return message.reply('The user is not banned.')
            })

        if (!banned) return

        const errors = []
        let data = {
            banned: true,
            dm: true,
        }
        try {
            await fh.bans.remove(user.id, { cache: true })
        } catch (e) {
            errors.push(e.message)
            data.banned = false
        }
        try {
            if (!data.banned) return message.reply("Couldn't unban the member!")
            await user.send({
                embeds: [
                    {
                        title: 'Your ban has been lifted!',
                        color: 'GREEN',
                        description: `You have been unbanned from [FightHub](https://discord.gg/fight)! You can join back now.\nResponsible moderator: **${message.author.tag}**`,
                        timestamp: Date.now(),
                        color: 'GREEN',
                    },
                ],
            })
        } catch (e) {
            errors.push(e.message)
            data.dm = false
        }

        return message.reply({
            embeds: [
                {
                    title: 'Member unban',
                    description: `Info:\n<:blank:914473340129906708>Member unbanned: ${
                        data.banned ? '☑️' : ':x:'
                    }\n<:blank:914473340129906708>User DM'd: ${
                        data.dm ? '☑️' : ':x:'
                    }\n<:blank:914473340129906708>Reason: \`${reason}\``,
                },
            ],
        })
    },
}
