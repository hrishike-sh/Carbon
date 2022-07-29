const {
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Message,
    TextChannel,
    Collection,
} = require('discord.js')
const giveawayModel = require('../database/models/giveaway')
const voteModel = require('../database/models/user')
const ms = require('pretty-ms')
let i = 0
let presenceCounter1 = 0
let presenceCounter2 = 0
let gawCounter1 = 0
let randomColorCounter = 0
let statusCounter = 0
let voteReminderCounter = 0
let messageCounter = 0
const entries = new Collection()

module.exports = {
    name: 'tick',
    once: false,
    /**
     * @param {Client} client
     */
    async execute(client) {
        // Incrementing everything
        voteReminderCounter++
        randomColorCounter++
        messageCounter++
        statusCounter++
        gawCounter1++
        // Incrementing everything

        // Hot status
        if (statusCounter > 59) {
            statusCounter = 0
            const statuses = [
                {
                    status: 'dnd',
                    activities: [
                        {
                            name: `${client.counts.messages.toLocaleString()} messages!`,
                            type: 2,
                        },
                    ],
                },
                {
                    status: 'dnd',
                    activities: [
                        {
                            name: `${
                                [
                                    'Minecraft',
                                    'Valorant',
                                    'Rainbow Six Seige',
                                    'Genshin Impact',
                                    'Counter Strike',
                                ][Math.floor(Math.random() * 5)]
                            }`,
                            type: 0,
                        },
                    ],
                },
                {
                    status: 'dnd',
                    activities: [
                        {
                            name: `${
                                [
                                    'Naruto',
                                    'Naruto: Shippuden',
                                    'Bleach',
                                    'One Piece',
                                    'Attack on Titan',
                                    'One Punch Man',
                                    'Death Note',
                                    'Vinland Saga',
                                    'Demon Slayer (mid)',
                                    "JoJo's Bizzare Adventures",
                                    'Hrish',
                                    'over my orphanage',
                                    'Jujutsu Kaisen',
                                    'Your Name.',
                                ][Math.floor(Math.random() * 14)]
                            }`,
                            type: 3,
                        },
                    ],
                },
            ]

            client.user.setPresence(
                statuses[Math.floor(Math.random() * statuses.length)]
            )
        }
        // Hot status

        // Random Color
        if (randomColorCounter > 119) {
            randomColorCounter = 0

            const fh = client.guilds.cache.get(client.db.fighthub.id)
            const random = [
                'WHITE',
                'AQUA',
                'GREEN',
                'BLUE',
                'YELLOW',
                'PURPLE',
                'LUMINOUS_VIVID_PINK',
                'FUCHSIA',
                'GOLD',
                'ORANGE',
                'RED',
                'GREY',
                'DARKER_GREY',
                'NAVY',
                'FF355E',
                'FD5B78',
                'FF6037',
                'FF9966',
                'FF9933',
                'FFCC33',
                'FFFF66',
                'FFFF66',
                'CCFF00',
                '66FF66',
                'AAF0D1',
                '50BFE6',
                'FF6EFF',
                'EE34D2',
                'FF00CC',
                'FF00CC',
            ]
            fh.roles.cache
                .get('857817197417594921')
                .setColor(random[Math.floor(Math.random() * random.length)])
        }
        // Random Color

        if (voteReminderCounter == 30) {
            voteReminderCounter = 0
            let query = await voteModel.find({})
            query = query.filter(
                (val) =>
                    val.fighthub &&
                    val.fighthub.voting.enabled &&
                    val.fighthub.voting.hasVoted &&
                    val.fighthub.voting.lastVoted < new Date().getTime()
            )
            if (!query || !query.length) {
            } else {
                for (const q of query) {
                    const user = client.users.cache.get(q.userId) || null
                    if (!user) {
                        q.fighthub.voting.hasVoted = false
                        q.save()
                    } else {
                        try {
                            ;(await user.createDM()).send({
                                embeds: [
                                    new MessageEmbed()
                                        .setTitle('Vote Reminder')
                                        .setColor('GREEN')
                                        .setTimestamp()
                                        .setDescription(
                                            `You can vote for **[FightHub](https://discord.gg/fight)** now!\nClick **[here](https://top.gg/servers/824294231447044197/vote)** to vote! Last vote was <t:${(
                                                (q.fighthub.voting.lastVoted -
                                                    require('ms')('12h')) /
                                                1000
                                            ).toFixed(
                                                0
                                            )}:R>\n\nOnce you vote, you will be reminded again after 12 hours. Thanks for your support! You can toggle vote reminders by running \`fh voterm\``
                                        )
                                        .setThumbnail(
                                            client.db.fighthub.iconURL()
                                        ),
                                ],
                            })
                        } catch (e) {
                            q.fighthub.voting.enabled = false
                        } finally {
                            client.channels.cache
                                .get('921645520471085066')
                                .send(
                                    `${user.tag} was **reminded** to vote again.`
                                )
                            q.fighthub.voting.hasVoted = false
                            q.save()
                        }
                    }
                }
            }
        }
        const processing = new Collection()
        // GIVEAWAYS
        if (gawCounter1 > 5) {
            gawCounter1 = 0

            const Query = await giveawayModel.find({
                hasEnded: false,
                endsAt: {
                    $lt: new Date().getTime(),
                },
            })

            for (const giveaway of Query) {
                if (processing.has(giveaway.messageId)) continue

                processing.set(giveaway.messageId, 'x')

                try {
                    const channel = client.channels.cache.get(
                        giveaway.channelId
                    )

                    if (channel) {
                        try {
                            const message = await channel.messages.fetch(
                                giveaway.messageId
                            )

                            if (message) {
                                let winners = []
                                if (giveaway.winners > 1) {
                                    for (i = 0; i < giveaway.winners; i++) {
                                        winners.push(
                                            giveaway.entries.filter(
                                                (val) => !winners.includes(val)
                                            )[
                                                Math.floor(
                                                    Math.random() *
                                                        giveaway.entries.filter(
                                                            (val) =>
                                                                !winners.includes(
                                                                    val
                                                                )
                                                        ).length
                                                )
                                            ]
                                        )
                                    }
                                } else {
                                    winners = [
                                        giveaway.entries[
                                            Math.floor(
                                                Math.random() *
                                                    giveaway.entries.length
                                            )
                                        ],
                                    ]
                                }

                                for (let win = 0; win < winners.length; win++) {
                                    const embed = new MessageEmbed()
                                        .setTitle(
                                            '🎊 You have won a giveaway! 🎊'
                                        )
                                        .setDescription(
                                            `You have won the giveaway for **\`${giveaway.prize}\`**!`
                                        )
                                        .addField(
                                            'Host',
                                            `<@${giveaway.hosterId}>`,
                                            true
                                        )
                                        .addField(
                                            'Giveaway link',
                                            `[Jump](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`,
                                            true
                                        )
                                        .setTimestamp()
                                        .setColor('GREEN')

                                    const content = `<@${winners[win]}>`

                                    client.functions.dmUser(
                                        client,
                                        winners[win],
                                        {
                                            content,
                                            embeds: embed,
                                        }
                                    )
                                }
                                giveaway.WWinners = winners
                                winners = winners
                                    .map((a) => `<@${a}>`)
                                    .join(' ')

                                message.edit({
                                    content: `🎉 Giveaway Ended 🎉`,
                                    embeds: [
                                        new MessageEmbed()
                                            .setTitle(giveaway.prize)
                                            .setFooter({
                                                text: `Winners: ${giveaway.winners} | Ended at`,
                                            })
                                            .setTimestamp()
                                            .setColor('NOT_QUITE_BLACK')
                                            .setDescription(
                                                `Winner(s): ${winners}\nHost: <@${giveaway.hosterId}>`
                                            )
                                            .setFields(
                                                message.embeds[0].fields
                                            ),
                                    ],
                                    components: [
                                        new MessageActionRow().addComponents([
                                            new MessageButton()
                                                .setLabel(
                                                    `🎉 ${giveaway.entries.length.toLocaleString()}`
                                                )
                                                .setCustomId('giveaway-join')
                                                .setStyle('PRIMARY')
                                                .setDisabled(),
                                        ]),
                                    ],
                                })

                                message.channel.send({
                                    content: `${winners}\nYou have won the giveaway for **${
                                        giveaway.prize
                                    }**! Your chances of winning the giveaway were **${(
                                        (1 / giveaway.entries.length) *
                                        100
                                    ).toFixed(3)}%**`,
                                    components: [
                                        new MessageActionRow().addComponents([
                                            new MessageButton()
                                                .setLabel('Jump')
                                                .setStyle('LINK')
                                                .setURL(
                                                    `https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`
                                                ),
                                            new MessageButton()
                                                .setLabel('Reroll')
                                                .setCustomId('giveaway-reroll')
                                                .setStyle('SECONDARY'),
                                        ]),
                                    ],
                                })

                                try {
                                    ;(
                                        await client.users.fetch(
                                            giveaway.hosterId
                                        )
                                    ).send({
                                        embeds: [
                                            new MessageEmbed()
                                                .setTitle(
                                                    'Your giveaway has ended!'
                                                )
                                                .setDescription(
                                                    `Your giveaway for \`${giveaway.prize}\` has ended!`
                                                )
                                                .addField(
                                                    'Giveaway Link',
                                                    `[Jump](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`,
                                                    true
                                                )
                                                .addField(
                                                    'Winners',
                                                    `${winners}`,
                                                    true
                                                )
                                                .setTimestamp()
                                                .setColor('GREEN'),
                                        ],
                                    })
                                } catch (e) {
                                } finally {
                                    if (giveaway.sponsor.id) {
                                        try {
                                            await (
                                                await client.users.fetch(
                                                    giveaway.sponsor.id
                                                )
                                            ).send({
                                                embeds: [
                                                    new MessageEmbed()
                                                        .setTitle(
                                                            'Thank you for sponsoring!'
                                                        )
                                                        .setDescription(
                                                            `Your giveaway for **${
                                                                giveaway.prize
                                                            }** has ended and you were thanked **${giveaway.sponsor.thanks.toLocaleString()}** times!`
                                                        )
                                                        .setColor('AQUA'),
                                                ],
                                            })
                                        } catch (_) {}
                                    }
                                }
                            }
                        } catch (_) {}
                    }
                } catch (_) {
                } finally {
                    processing.delete(giveaway.messageId)
                    giveaway.hasEnded = true
                    giveaway.save()
                    continue
                }
            }
        }
        // GIVEAWAYS

        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
