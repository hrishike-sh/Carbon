const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'howgay',
    args: true,
    usage: '<user> <high / low>',
    description: "Dank Memer's howgay fighthub method, but its automatic!",
    async execute(message, args) {
        const opponent =
            message.mentions.users.size > 0
                ? message.mentions.users.first()
                : null
        args.shift()
        let horll = args[0]
        if (!opponent)
            return message.channel.send(
                'You must mention someone to fight with them.'
            )
        if (
            !horll ||
            (horll.toLowerCase() !== 'low' && horll.toLowerCase() !== 'high')
        ) {
            return message.reply(
                'Please specify high or low\n\nExample: `fh howgay @user high`'
            )
        }
        const filter = (user) => user.id === opponent.id
        let player1rate = Math.floor(Math.random() * 100)
        let player2rate = Math.floor(Math.random() * 100)
        horll = horll.toLowerCase()
        let thisMessage = await message.channel.send(
            `${opponent} react to fight with ${message.author}.`
        )
        await thisMessage.react('✔️')
        await sleep(800)
        await thisMessage.react('❌')
        const filter2 = (reaction, user) =>
            ['✔️', '❌'].includes(reaction.emoji.name) &&
            user.id === opponent.id
        thisMessage
            .awaitReactions({ filter2, max: 1, time: 3e4 })
            .then(async (responseReaction) => {
                if (responseReaction.first().emoji.name === '❌') {
                    return message.channel.send('Howgay has been cancelled!')
                }

                let gayBed = {
                    title: 'HOWGAY',
                    description: 'Starting soon',
                    color: 'RANDOM',
                    footer: {
                        text: 'Good Luck',
                    },
                    timestamp: new Date(),
                    thumbnail: {
                        url: 'https://cdn.discordapp.com/avatars/855652438919872552/a3f12433ad44ff43bb9568222b4c4a4b.png?size=1024',
                    },
                }

                const mainMessage = await message.channel.send({
                    embeds: [gayBed],
                })
                await sleep(1000)
                gayBed.fields = [
                    {
                        name: message.author.tag,
                        value: `Rate: **${player1rate}**`,
                    },
                ]
                gayBed.description = 'Good Luck!'
                mainMessage.edit({ embeds: [gayBed] })

                await sleep(1000)
                gayBed.fields = [
                    {
                        name: message.author.tag,
                        value: `Rate: **${player1rate}**`,
                        inline: true,
                    },
                    {
                        name: opponent.tag,
                        value: `Rate: **${player2rate}**`,
                        inline: true,
                    },
                ]
                mainMessage.edit({ embeds: [gayBed] })

                let finalD = ''
                if (horll === 'low') {
                    if (player1rate > player2rate) {
                        finalD = `${opponent} has won the howgay!`
                    } else if (player2rate >= player1rate) {
                        finalD = `${message.author} has won the howgay!`
                    } else {
                        finalD = `Its a tie?!`
                    }
                } else {
                    if (player1rate > player2rate) {
                        finalD = `${message.author} has won the howgay!`
                    } else if (player2rate >= player1rate) {
                        finalD = `${opponent} has won the howgay!`
                    } else {
                        finalD = `Its a tie?!`
                    }
                }

                gayBed.description = finalD

                mainMessage.edit({ embeds: [gayBed], content: finalD })
            })
            .catch((e) => {
                message.channel.send(`${e}`)
            })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 */
