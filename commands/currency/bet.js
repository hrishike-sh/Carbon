const {
    Message,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const { addCoins, removeCoins, getUser } = require('../../functions/currency')
module.exports = {
    name: 'bet',
    aliases: ['gamble', 'wager'],
    usage: '<@user> <amount>',
    args: true,
    description: 'Gamble all your coins away!',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const target = message.mentions.members?.first()
        if (!target) return message.reply(`You must ping someone to play with!`)
        args.shift()
        let amount = args[0]
        if (!amount) return message.reply(`Specify your bet.`)

        amount = message.client.functions.parseAmount(args[0])
        if (!amount)
            return message.reply(
                `Could not parse \`${args[0]}\` as valid amount!`
            )

        const player = await getUser(target.id)
        const opponent = await getUser(message.author.id)
        if (amount > opponent.Balance)
            return message.reply(
                `You don't even have ${amount.toLocaleString()} coins :skull:`
            )
        if (amount > player.Balance)
            return message.reply(
                `${target.toString()} doesn't even have ${amount.toLocaleString()} coins :skull:`
            )

        const confirmation = await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setTitle('Confirmation')
                    .setDescription(
                        `${target.toString()} do you want to fight with ${message.author.toString()}?\nWinner gets ${(
                            amount * 2
                        ).toLocaleString()} coins!`
                    )
                    .setFooter({
                        text: 'The one who rolls a higher number wins!',
                    }),
            ],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton()
                        .setLabel('Accept')
                        .setCustomId('bet-yes')
                        .setStyle('SUCCESS'),
                    new MessageButton()
                        .setLabel('Deny')
                        .setCustomId('bet-no')
                        .setStyle('DANGER'),
                ]),
            ],
        })
        const collector = confirmation.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== target.id) {
                    return b.reply({
                        content: 'This is not for you',
                        ephemeral: true,
                    })
                } else return true
            },
            idle: 20000,
        })

        collector.on('collect', async (button) => {
            collector.stop()
            button.deferUpdate()
            if (button.customId.includes('no'))
                return message.channel.send('The fight offer was declined.')

            const gamedat = [
                { user: message.member, roll: Math.floor(Math.random() * 100) },
                { user: target, roll: Math.floor(Math.random() * 100) },
            ]
            ;[target.id, message.author.id].forEach((a) => {
                removeCoins(a, amount)
            })
            const msg = await message.channel.send(`Rolling...`)

            for await (const a of gamedat) {
                await message.client.functions.sleep(1500)
                await msg.edit(
                    `${msg.content}\n${a.user.toString()} rolls ${a.roll}`
                )
            }

            await message.client.functions.sleep(1500)
            const winner = gamedat.sort((a, b) => a.roll - b.roll)[0]
            msg.edit(
                `~~${
                    msg.content
                }~~\n\n:trophy: ${winner.user.toString()} has won ${(
                    amount * 2
                ).toLocaleString()} coins!! :trophy:`
            )

            addCoins(winner.user.id, amount * 2)
        })

        collector.on('end', () => {
            confirmation.components[0].components.forEach((c) =>
                c.setDisabled()
            )

            confirmation.edit({
                components: confirmation.components,
            })
        })
    },
}
