const {
    MessageEmbed,
    MessageButton,
    MessageActionRow,
    Message,
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
     * @returns
     */
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
        let player1rate = Math.floor(Math.random() * 100)
        let player2rate = Math.floor(Math.random() * 100)
        horll = horll.toLowerCase()
        const yesbut = new MessageButton()
            .setCustomId('yes-hg')
            .setLabel('Confirm')
            .setStyle('SUCCESS')
        const nobut = new MessageButton()
            .setCustomId('no-hg')
            .setLabel('Deny')
            .setStyle('DANGER')
        const row = new MessageActionRow().addComponents([yesbut, nobut])
        let thisMessage = await message.channel.send({
            content: `${opponent.toString()}`,
            embeds: [
                {
                    title: 'Confirmation',
                    description: `${message.member.toString()} wants to challenge you for a game of howgay.\nWhat do you say?`,
                    color: 'YELLOW',
                    timestamp: new Date(),
                },
            ],
            components: [row],
        })

        const collector = thisMessage.createMessageComponentCollector({
            time: 25000,
        })
        collector.on('collect', async (button) => {
            if (button.user.id !== opponent.id) {
                return button.reply({
                    content: 'This is not for you.',
                    ephemeral: true,
                })
            }
            if (button.customId == 'no-hg') {
                button.deferUpdate()
                thisMessage.delete()
                message.channel.send('The fight was cancelled.')
                return
            }
            button.deferUpdate()
            thisMessage.delete()
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
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 */
//stfu
