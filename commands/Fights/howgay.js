const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    Message,
    ButtonStyle,
} = require('discord.js')

module.exports = {
    name: 'howgay',
    category: 'Fights',
    args: true,
    usage: '<user> <high / low>',
    description: "Dank Memer's howgay fighthub method, but its automatic!",
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const target = message.mentions.users?.first()
        if (!target)
            return message.reply(`You have to mention someone to fight them.`)
        args.shift()
        const what = args[0]
        if (!what || !['low', 'high'].includes(what.toLowerCase()))
            return message.reply(
                `You have to specify either high or low.\n\nExample: \`fh howgay @Hrishikesh#0369 low\``
            )
        const confirmation = (
            await message.channel.send({
                content: target.toString(),
                embeds: [
                    {
                        title: 'Confirmation',
                        description: `${message.author.toString()} has challenged you for a game of howgay!\nDo you accept their challenge?`,
                        footer: {
                            text: 'Use the buttons.',
                        },
                    },
                ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setCustomId('hg-yes')
                            .setLabel('Accept'),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId('hg-no')
                            .setLabel('Deny'),
                    ]),
                ],
            })
        ).createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== target.id) {
                    return b.reply({
                        content: 'This is not your challenge.',
                        ephemeral: true,
                    })
                } else return true
            },
            idle: 10 * 1000,
        })

        confirmation.on('collect', async (button) => {
            confirmation.stop()
            button.deferUpdate()
            if (button.customId.includes('no'))
                return message.channel.send(
                    `The challange was denied by ${button.user.toString()}`
                )
            const gamedata = [
                {
                    user: message.author,
                    rate: Math.floor(Math.random() * 100),
                },
                {
                    user: target,
                    rate: Math.floor(Math.random() * 100),
                },
            ]
            const embed = new EmbedBuilder()
                .setTitle(`Howgay [${what.toUpperCase()}]`)
                .setDescription('The bot will automatically show the winner!')
                .setFooter({
                    text: "isn't that gay",
                })
                .setColor('Aqua')
            const fancy = await message.channel.send({
                embeds: [embed],
            })
            await client.functions.sleep(500)
            embed.addFields([
                {
                    name: `${gamedata[0].user.tag}`,
                    value: `Rate: ${gamedata[0].rate}%`,
                    inline: true,
                },
            ])
            await fancy.edit({
                embeds: [embed],
            })
            await client.functions.sleep(2500)
            embed.addFields([
                {
                    name: `${gamedata[1].user.tag}`,
                    value: `Rate: ${gamedata[1].rate}%`,
                    inline: true,
                },
            ])
            await fancy.edit({
                embeds: [embed],
            })

            let winner
            if (gamedata[0].rate == gamedata[1].rate) {
                winner = "It's a tie!!"
            } else {
                if (what === 'low') {
                    winner = `${gamedata
                        .sort((a, b) => a.rate - b.rate)[0]
                        .user.toString()} has won the howgay!`
                } else {
                    winner = `${gamedata
                        .sort((a, b) => b.rate - a.rate)[0]
                        .user.toString()} has won the howgay!`
                }
            }

            fancy.reply(winner)
        })
        confirmation.on('end', () => {
            const msg = message.channel.messages.cache.get(
                confirmation.messageId
            )
            msg.components[0].components.forEach((c) =>
                ButtonBuilder.from(c).setDisabled()
            )
            msg.edit({
                components: msg.components,
            })
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 */
//stfu
