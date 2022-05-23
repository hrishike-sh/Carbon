const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const EventModel = require('../../database/models/30k')
const emo_jis = [
    '<:blank:914473340129906708><:black1:919554266929197117>',
    '<:blank:914473340129906708><:b2:919554323363557396>',
    '<:blank:914473340129906708><:b3:919559077485486091>',
    '<:blank:914473340129906708><:b4:919559410668425266>',
    '<:blank:914473340129906708><:b5:919554441525493760>',
    '<:blank:914473340129906708><:b6:919554511247388712>',
    '<:blank:914473340129906708><:b7:920240450667950101>',
    '<:blank:914473340129906708><:b8:931434424787148840>',
    '<:blank:914473340129906708><:b9:919554613840076840>',
    '<:black1:919554266929197117><:bo:919555310228742144>',
]
module.exports = {
    name: '30k',
    usage: `<USER>`,
    description: 'Check your donation/leaderboard for the 30k event!',
    category: 'Donation',
    fhOnly: true,
    /**
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const target = message.mentions.members?.first() || message.member

        const all = await EventModel.find()
        const dbUser = all.find((a) => a.userId === target.id) || null
        let donoEmbed = new MessageEmbed()
        let donated = true

        if (!dbUser) donated = false

        if (donated) {
            donoEmbed
                .setDescription(
                    `Showing donations for user: ${target.toString()}`
                )
                .setColor('RANDOM')
                .addField(
                    'Amount donated:',
                    dbUser.amount.toLocaleString(),
                    true
                )
                .addField(
                    'Position on leaderboard:',
                    `#${all.indexOf(dbUser) + 1}`
                )
        } else {
            donoEmbed
                .setDescription(
                    `${target.toString()} has not donated towards the 30k event!`
                )
                .setColor('RED')
        }

        const main = await message.reply({
            embeds: [donoEmbed],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton()
                        .setStyle('PRIMARY')
                        .setLabel('Donation')
                        .setCustomId('30k-view_dono')
                        .setDisabled(),
                    new MessageButton()
                        .setStyle('SECONDARY')
                        .setLabel('Leaderboard')
                        .setCustomId('30k-lb'),
                ]),
            ],
        })
        const collector = main.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== message.author.id) {
                    return b.reply({
                        content: 'This is not for your use.',
                        ephemeral: true,
                    })
                } else return true
            },
            idle: 15 * 1000,
        })

        collector.on('collect', async (button) => {
            const id = button.customId.replace('30k-', '')
            button.deferUpdate()
            if (id == 'lb') {
                const rawLB = all
                    .sort((a, b) => a.amount - b.amount)
                    .slice(0, 9)
                let data = ''
                let inLb = false
                for (const x of rawLB) {
                    const user = await client.users.fetch(x.userId)
                    if (user.id == target.id) {
                        inLb = true
                        data += `**${emo_jis[rawLB.indexOf(x)]}: ${
                            user.tag
                        } => ⏣ ${x.amount.toLocaleString()}**\n`
                    } else {
                        data += `${emo_jis[rawLB.indexOf(x)]}: ${
                            user.tag
                        } => ⏣ ${x.amount.toLocaleString()}\n`
                    }
                }

                if (!inLb && dbUser) {
                    data += `\n${all.indexOf(dbUser) + 1}: ${
                        target.tag
                    } => ⏣ ${dbUser.amount.toLocaleString()}`
                }
                button.message.components[0].components
                    .find((a) => a.customId === '30k-lb')
                    .setDisabled(true)
                    .setStyle('PRIMARY')
                button.message.components[0].components
                    .find((a) => a.customId !== '30k-lb')
                    .setDisabled(false)
                    .setStyle('SECONDARY')

                await main.edit({
                    embeds: [
                        {
                            title: 'Leaderboard',
                            description: data,
                            color: 'GREEN',
                        },
                    ],
                    components: button.message.components,
                })
            } else if (id == 'view_dono') {
                button.message.components[0].components
                    .find((a) => a.customId === '30k-lb')
                    .setDisabled(false)
                    .setStyle('SECONDARY')
                button.message.components[0].components
                    .find((a) => a.customId !== '30k-lb')
                    .setDisabled(true)
                    .setStyle('PRIMARY')

                button.message.edit({
                    embeds: [donoEmbed],
                    components: button.message.components,
                })
            }
        })

        collector.on('end', () => {
            main.components[0].components.forEach((a) => {
                a.setDisabled(true)
            })

            main.edit({
                components: main.components,
            })
        })
    },
}
