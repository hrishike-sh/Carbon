module.exports = {
    name: 'fetchban',
    aliases: ['fetchbans', 'baninfo'],
    args: true,
    usage: '<id>',
    category: 'Moderation',
    description: 'Check ban info about a certain user.',
    fhOnly: true,
    async execute(message, args) {
        const id = args[0]
        // daunt: move to config
        if (
            !message.member.roles.cache.some(
                (r) => r.id === '824348974449819658'
            ) &&
            !message.member.roles.cache.some(
                (r) => r.id === '824539655134773269'
            )
        ) {
            return message.channel.send("You can't use this")
        }

        const banInfo = await message.guild.fetchBan(id).catch(() => {
            return message.channel.send(
                'Either the user is not banned or the user ID provided is not valid.'
            )
        })

        if (!banInfo) return

        message.channel.send({
            embed: {
                description: `User: \`${
                    banInfo.user.username + '#' + banInfo.user.discriminator
                }\`(${id})`,
                fields: [
                    {
                        name: 'Reason',
                        value: banInfo.reason,
                    },
                ],
            },
        })
    },
}
