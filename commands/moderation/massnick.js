module.exports = {
    name: 'massnick',
    aliases: ['dis'],
    async execute(message) {
        if (!message.member.permissions.has('ADMINISTATOR'))
            return message.channel.send(
                'You must have ADMINISTATOR perms to perform this action.'
            )

        const ask1 = await message.channel.send(
            `Enter the text you want the nicknames to have!\n\nYou have 20 seconds to send the message.`
        )
        const getContains = ask1.channel.createMessageCollector(
            (m) => m.author.id === message.author.id,
            {
                time: 20000,
                max: 1,
            }
        )
        getContains.on('collect', async (msg) => {
            const toCheck = msg.content.toLowerCase()

            const ask2 = await message.channel.send(
                `What do you want me to change their nicks to?\n\nYou have 20 seconds to reply.`
            )

            const getToChange = ask2.channel.createMessageCollector(
                (m) => m.author.id === message.author.id,
                {
                    time: 20000,
                    max: 1,
                }
            )

            getToChange.on('collect', async (msg) => {
                const toChange = msg.content.toLowerCase()

                const members = message.guild.members.cache.filter((member) =>
                    member.displayName.toLowerCase().includes(toCheck)
                )

                console.log(members)
            })
        })
    },
}
