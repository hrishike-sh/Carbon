const Messages = require('discord-messages')
const Heists = require('../../functions/heist-dono')
const Special = require('../../functions/another-dono-thing-whyy')
const { MessageEmbed: Embed } = require('discord.js')
const { Message, Client, MessageEmbed } = require('discord.js')
module.exports = {
    name: 'lb',
    aliases: ['lb', 'leaderboard'],
    args: true,
    fhOnly: true,
    description: 'Check leaderboard for donations',
    /**
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     * @returns
     */
    async execute(message, args, client) {
        const mainMessage = await message.channel.send('Loading...')
        const dLb = (
            await Messages.computeLeaderboard(
                client,
                await Messages.fetchLeaderboard(message.guild.id, 10),
                true
            )
        ).map(
            (e) =>
                `${e.position}. ${e.username}#${
                    e.discriminator
                }\nDonated coins: **${e.messages.toLocaleCase()}**`
        )
        const hLb = (
            await Heists.computeLeaderboard(
                client,
                await Heists.fetchLeaderboard(message.guild.id, 10),
                true
            )
        ).map(
            (e) =>
                `${e.position}. ${e.username}#${
                    e.discriminator
                }\nDonated coins: **${e.amount.toLocaleCase()}**`
        )
        const fLb = (
            await Special.computeLeaderboard(
                client,
                await Special.fetchLeaderboard(message.guild.id, 10),
                true
            )
        ).map(
            (e) =>
                `${e.position}. ${e.username}#${
                    e.discriminator
                }\nDonated coins: **${e.amount.toLocaleCase()}**`
        )
        const embed = new MessageEmbed().setColor('YELLOW').setTimestamp()
        embed.setDescription(dLb.join('\n\n'))
        const collector = await mainMessage.edit({
            content: '',
            embeds: [embed],
        })

        if (args[0] === 'd') {
            const rawLBD = await Messages.fetchLeaderboard(message.guild.id, 10)
            if (rawLBD.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )

            const leaderboard = await Messages.computeLeaderboard(
                client,
                rawLBD,
                true
            )

            const lb = leaderboard.map(
                (e) =>
                    `${e.position}. ${e.username}#${
                        e.discriminator
                    }\nDonated coins: **${e.messages.toLocaleString()}**`
            )

            message.channel.send(`**__LEADERBOARD__**\n\n${lb.join('\n\n')}`)
        } else if (args[0] === 'h') {
            const rawLBH = await Heists.fetchLeaderboard(message.guild.id, 10)
            if (rawLBH.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )
            const leaderboard = await Heists.computeLeaderboard(
                client,
                rawLBH,
                true
            )
            const lb = leaderboard.map(
                (e) =>
                    `${e.position}. ${e.username}#${
                        e.discriminator
                    }\nDonated coins: **${e.amount.toLocaleString()}**`
            )

            message.channel.send(`**__LEADERBOARD__**\n\n${lb.join('\n\n')}`)
        } else if (args[0] === 'ff' || args[0] === 'special') {
            const rawLBF = await Special.fetchLeaderboard(message.guild.id, 10)
            if (rawLBF.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )
            const leaderboard = await Special.computeLeaderboard(
                client,
                rawLBF,
                true
            )
            const lb = leaderboard.map(
                (e) =>
                    `${e.position}. ${e.username}#${
                        e.discriminator
                    }\nDonated coins: **${e.amount.toLocaleString()}**`
            )

            message.channel.send({
                embeds: [
                    new Embed({
                        title: '**__Leaderboard__**',
                        description: lb.join('\n\n'),
                    }),
                ],
            })
        }
    },
}
