const Messages = require('discord-messages')
const Heists = require('../../functions/heist-dono')
const Special = require('../../functions/another-dono-thing-whyy')
const { MessageEmbed: Embed } = require('discord.js')

module.exports = {
    name: 'lb',
    aliases: ['lb', 'leaderboard'],
    args: true,
    description: 'Check leaderboard for donations',
    async execute(message, args, client) {
        if (!args[0])
            return message.channel.send(
                'Which leaderboard would you like to see?\n\nExample: `fh lb h`, `fh lb d`'
            )
        if (message.guild.id !== client.config.guildId) {
            args[0] = 'd'
        }
        if (args[0] === 'd') {
            const rawLB = await Messages.fetchLeaderboard(message.guild.id, 10)
            if (rawLB.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )

            const leaderboard = await Messages.computeLeaderboard(
                client,
                rawLB,
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
            const rawLB = await Heists.fetchLeaderboard(message.guild.id, 10)
            if (rawLB.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )
            const leaderboard = await Heists.computeLeaderboard(
                client,
                rawLB,
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
            const rawLB = await Special.fetchLeaderboard(message.guild.id, 10)
            if (rawLB.length < 1)
                return message.channel.send(
                    'Nobody has done any donations yet... or they are not counted yet.'
                )
            const leaderboard = await Special.computeLeaderboard(
                client,
                rawLB,
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
