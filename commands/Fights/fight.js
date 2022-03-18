const { Message } = require('discord.js')

module.exports = {
    name: 'fight',
    args: true,
    usage: '<user>',
    category: 'Fights',
    aliases: ['ffight'],
    description: 'Fight someone in the old dank memer style!',
    disabledChannels: ['870240187198885888', '796729013456470036'],
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const getRandom = message.client.functions.getRandom
        const actions = `Type **\`punch\`**, **\`kick\`**, **\`heal\`** or **\`end\`**`
        const actionArray = ['kick', 'punch', 'heal', 'end']
        const target = message.mentions.members.first() || null

        if (!target)
            return message.reply('You must mention someone to fight with.')
        if (target.user.bot) return message.reply('The bot would win.')
        if (target.id === message.author.id)
            return message.reply('You fight yourself... and win!')
        const gamedata = [
            {
                userId: message.author.id,
                hp: 100,
                name: message.author.username,
                mention: `<@${message.author.id}>`,
            },
            {
                userId: target.id,
                hp: 100,
                name: target.user.username,
                mention: `<@${target.id}>`,
            },
        ]

        let current = gamedata[getRandom(0, 2)]
        await message.channel.send(
            `${current.mention} it's your turn! What do you want to do?\n${actions}`
        )

        const collector = message.channel.createMessageCollector({
            filter: (m) =>
                [gamedata[0].userId, gamedata[1].userId].includes(m.author.id),
        })

        collector.on('collect', async (msg) => {
            if (msg.author.id !== current.userId) return

            if (!actionArray.includes(msg.content.toLowerCase()))
                return msg.reply(
                    `${current.mention} that is not a valid option bozo.\n${actions}`
                )

            const action = msg.content.toLowerCase()
            const opponent = gamedata.filter(
                (val) => val.userId !== current.userId
            )[0]

            if (action === 'punch') {
                const damage = getRandom(5, 25)
                opponent.hp -= damage

                const m = await msg.reply(
                    `**Punch** | **${current.name}** punches ${
                        opponent.name
                    } and deals **${damage}** damage!\n${
                        opponent.name
                    } is left with ${
                        opponent.hp < 1 ? '0' : opponent.hp
                    } health!`
                )
                if (checkDeath(opponent)) {
                    msg.channel.send(
                        `🏆🏆 **${current.name} has won the game** 🏆🏆`
                    )
                    collector.stop()
                } else {
                    m.edit(
                        `${m.content}\n\n${opponent.mention} its your turn! What do you want to do?\n${actions}`
                    )
                    current = opponent
                }
            } else if (action === 'kick') {
                const fall = [1, 1, 1, 2][getRandom(0, 4)] === 2

                if (fall) {
                    const fallDamage = getRandom(8, 20)
                    current.hp -= fallDamage

                    const m = await msg.reply(
                        `**Fall** | **${current.name}** tried to kick ${
                            opponent.name
                        } but FELL!! They took **${fallDamage}** damage.\nYou are now at **${
                            current.hp < 1 ? '0' : current.hp
                        }** health!`
                    )
                    if (checkDeath(current)) {
                        msg.channel.send(
                            `🏆🏆 **${opponent.name} has won the game** 🏆🏆`
                        )
                        collector.stop()
                    } else {
                        m.edit(
                            `${m.content}\n\n${opponent.mention} its your turn! What do you want to do?\n${actions}`
                        )
                        current = opponent
                    }
                } else {
                    const damage = getRandom(20, 40)
                    opponent.hp -= damage

                    const m = await msg.reply(
                        `**Kick** | **${current.name}** kicks ${
                            opponent.name
                        } and deals **${damage}** damage!\n${
                            opponent.name
                        } is at ${opponent.hp < 1 ? '0' : opponent.hp} health!`
                    )

                    if (checkDeath(opponent)) {
                        msg.channel.send(
                            `🏆🏆 **${current.name} has won the game** 🏆🏆`
                        )
                        collector.stop()
                    } else {
                        m.edit(
                            `${m.content}\n\n${opponent.mention} its your turn! What do you want to do?\n${actions}`
                        )
                        current = opponent
                    }
                }
            } else if (action === 'heal') {
                const heal = getRandom(5, 15)

                if (current.hp > 99) {
                    msg.reply(
                        `You tried to heal but you're already at 100HP! You lost your turn!\n${opponent.mention} its your turn! What do you want to do?\n${actions}`
                    )
                    current = opponent
                } else {
                    current.hp += heal

                    msg.reply(
                        `**Heal** | **${current.name}** has healed **${heal}** health! They are now at ${current.hp} health.\n${opponent.mention} its your turn! What do you want to do?\n${actions}`
                    )

                    current = opponent
                }
            } else if (action === 'end') {
                collector.stop()

                message.channel.send(
                    `🏆🏆 **${opponent.name} has won the game** 🏆🏆`
                )
            }
        })
    },
}

const checkDeath = (cur) => {
    return cur.hp < 1
}
