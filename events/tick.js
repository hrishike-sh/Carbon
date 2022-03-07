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
const timerModel = require('../database/models/timer')
const voteModel = require('../database/models/user')
const messageModel = require('../database/models/ping')
const ms = require('pretty-ms')
let i = 0
let presenceCounter1 = 0
let presenceCounter2 = 0
let gawCounter1 = 0
let randomColorCounter = 0
let timerCounter = 0
let voteReminderCounter = 0
let messageCounter = 0
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
        gawCounter1++
        // Incrementing everything

        // Random Color
        if (randomColorCounter == 300) {
            randomColorCounter = 0

            const random_hex_color_code = () => {
                // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-11.php
                let n = (Math.random() * 0xfffff * 1000000).toString(16)
                return '#' + n.slice(0, 6)
            }

            client.guilds.cache
                .get('817734579246071849')
                .roles.cache.get('916045576695590952')
                .setColor(random_hex_color_code())
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
        const entries = new Collection()
        // GIVEAWAYS
        if (gawCounter1 > 5) {
            gawCounter1 = 0
            const MainQuery = await giveawayModel.find({ hasEnded: false })
            const gaws = MainQuery.filter(
                (val) => val.endsAt < new Date().getTime()
            )

            const toEdit = MainQuery.filter(
                (gaw) => gaw.entries.length !== entries.get(gaw.messageId)
            )

            for (const a of MainQuery) {
                entries.set(a.messageId, a.entries.length)
            }

            for (const edit of toEdit) {
                const channel = client.channels.cache.get(edit.channelId)
                if (channel) {
                    let message = channel.messages
                        .fetch(edit.messageId)
                        .catch((e) => {
                            edit.hasEnded = true
                            edit.save()
                            message = null
                        })
                    if (message) {
                        message.edit({
                            components: [
                                new MessageActionRow().addComponents([
                                    new MessageButton()
                                        .setEmoji('🎉')
                                        .setLabel(
                                            edit.entries.length.toLocaleString()
                                        )
                                        .setCustomId('giveaway-join')
                                        .setStyle('SUCCESS'),
                                ]),
                            ],
                        })
                    }
                }
            }

            for (const giveaway of gaws) {
                giveaway.hasEnded = true
                giveaway.save()
                const channel = client.channels.cache.get(giveaway.channelId)
                if (channel) {
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
                                                giveaway.entries.length
                                        )
                                    ]
                                )
                            }
                        } else
                            winners = [
                                giveaway.entries[
                                    Math.floor(
                                        Math.random() * giveaway.entries.length
                                    )
                                ],
                            ]
                        winners = winners.map((a) => `<@${a}>`).join(' ')

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
                                    ),
                            ],
                            components: [
                                new MessageActionRow().addComponents([
                                    new MessageButton()
                                        .setLabel(
                                            `Entries: ${giveaway.entries.length.toLocaleString()}`
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
                            ;(await client.users.fetch(giveaway.hosterId)).send(
                                {
                                    embeds: [
                                        new MessageEmbed()
                                            .setTitle(
                                                'Your giveaway has ended!'
                                            )
                                            .setDescription(
                                                `Your giveaway for \`${giveaway.prize}\` has ended!`
                                            )
                                            .addField(
                                                'Message Link',
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
                                }
                            )
                        } catch (e) {}
                    }
                }
            }
        }
        // GIVEAWAYS

        // MESSAGES
        // if(messageCounter > 300000){
        //     const messages = client.db.messages

        //     messages.forEach(async (value, key) => {
        //         await messageModel.findOneAndUpdate({
        //             userId: key
        //         }, {
        //             $inc: {
        //                 daily: value.messages,
        //                 weekly: value.messages,
        //                 monthly: value.messages,
        //             }
        //         }, {
        //             upsert: true
        //         })
        //         const a = messages.get(key)
        //         a.messages = 0
        //     })
        // }
        // MESSAGES

        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
