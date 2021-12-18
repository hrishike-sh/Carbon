const {
    Client,
    MessageEmbed
} = require("discord.js");
const giveawayModel = require('../database/models/giveaway')
const {
    MessageActionRow,
    MessageButton
} = require('discord-buttons')
const timerModel = require('../database/models/timer')
const voteModel = require('../database/models/user')
const ms = require('pretty-ms')
let i = 0;
let presenceCounter1 = 0;
let presenceCounter2 = 0;
let gawCounter1 = 0;
let randomColorCounter = 0;
let timerCounter = 0;
let voteReminderCounter = 0;
module.exports = {
    name: 'tick',
    once: false,
    /**
     * @param {Client} client 
     */
    async execute(client) {

        // Incrementing everything
        presenceCounter1++
        // gawCounter1++
        voteReminderCounter++
        randomColorCounter++
        // timerCounter++
        // Incrementing everything

        // Presence
        const presences = [{
            name: `${client.users.cache.size.toLocaleString()} fighters!`,
            type: `WATCHING`
        },
        {
            name: `${client.guilds.cache.size.toLocaleString()} servers!`,
            type: 'COMPETING'
        }
        ]
        if (presenceCounter1 == 60) {
            presenceCounter1 = 0;
            if (++presenceCounter2 >= presences.length) {
                presenceCounter2 = 0
            }

            client.user.setActivity({
                name: presences[presenceCounter2].name,
                type: presences[presenceCounter2].type
            })


        }
        // Presence

        // Giveaways
        if (gawCounter1 == 5) {
            gawCounter1 = 0;

            const gaws = await giveawayModel.find({
                endsAt: {
                    $lte: new Date().getTime()
                },
                hasEnded: false
            });

            if (!gaws || !gaws.length) {

            } else {

                for (const giveaway of gaws) {

                    giveaway.hasEnded = true;
                    giveaway.save()

                    const channel = await client.channels.cache.get(`${giveaway.channelId}`)
                    if (!channel) {

                    } else {
                        const message = await channel.messages.fetch(`${giveaway.messageId}`)
                        if (!message) {

                        } else {
                            const winner = `<@${giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)]}>`

                            await message.edit("This giveaway has ended.", {
                                embed: {
                                    title: giveaway.prize || '',
                                    description: `Winner: ${winner}\nHosted By: <@${giveaway.hosterId}>`,
                                    color: 'black',
                                    footer: {
                                        text: `Winners: ${giveaway.winners}`,
                                    },
                                    timestamp: new Date(),
                                },
                                components: new MessageActionRow().addComponents([new MessageButton().setStyle("green").setID('whydodisabledbuttonsneedanid').setLabel("Enter").setDisabled(), new MessageButton().setStyle("grey").setID("giveaway-info").setLabel("View Info")])
                            })

                            await channel.send(`The giveaway for **${giveaway.prize}** has ended and the winner is ${winner}!`, {
                                embed: {
                                    title: 'Giveaway Info',
                                    description: `Entries: **${giveaway.entries.length.toLocaleString()}**\nChances of winning: **${(1 / giveaway.entries.length * 100).toFixed(3)}%**`,
                                    footer: {
                                        text: "Congrats!"
                                    },
                                    timestamp: new Date()
                                }
                            })

                            client.users.cache.get(`${giveaway.hosterId}`).send({
                                embed: {
                                    title: "Giveaway Result",
                                    description: `The giveaway you hosted has ended!`,
                                    fields: [{
                                        name: "Winner",
                                        value: winner,
                                    },
                                    {
                                        name: 'Link',
                                        value: `[Jump](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`
                                    }
                                    ]
                                }
                            })


                        }

                    }


                }
            }

        }
        // Giveaways

        // Random Color
        if (randomColorCounter == 300) {
            randomColorCounter = 0;

            const random_hex_color_code = () => {
                // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-11.php
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return '#' + n.slice(0, 6);
            };

            client.guilds.cache.get("817734579246071849").roles.cache.get("916045576695590952").setColor(random_hex_color_code())

        }
        // Random Color

        // Timer
        if (timerCounter == 10) {
            timerCounter = 0
            const timers = await timerModel.find({
                ended: false
            })

            if (!timers || !timers.length) {

            } else {
                const RemindBut = new MessageButton().setEmoji("🔔").setStyle("green").setID("remind_me")
                const row = new MessageActionRow().addComponents([RemindBut])

                for (const timer of timers) {
                    const time = timer.time - new Date().getTime()

                    const channel = client.channels.cache.get(timer.channelId)
                    if (!channel) {

                    } else {


                        const message = await channel.messages.fetch(timer.messageId)
                        if (!message) {

                        } else {

                            if (time < 0) {
                                message.channel.send(timer.reminders.map(u => `<@${u}>`).join('') || "No people that wanted to be reminded moment.").then(async msg => {
                                    setTimeout(() => {
                                        msg.delete()
                                    }, 2500)
                                })
                                message.edit({
                                    embed: new MessageEmbed()
                                        .setAuthor(client.users.cache.get(timer.member).username, client.users.cache.get(timer.member).displayAvatarURL())
                                        .setTitle(timer.reason)
                                        .setColor("RANDOM")
                                        .setDescription(`The timer has ended!`)
                                        .setFooter("Hmm.", client.user.displayAvatarURL()),
                                    components: null
                                })
                                message.channel.send(`The timer for **${timer.reason}** has ended!\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`)
                                timer.ended = true;
                                timer.save()
                            } else {
                                message.edit({
                                    embed: new MessageEmbed()
                                        .setAuthor(client.users.cache.get(timer.member).username, client.users.cache.get(timer.member).displayAvatarURL())
                                        .setTitle(timer.reason)
                                        .setColor("RANDOM")
                                        .setDescription(`${ms(time, { verbose: true })} left...`)
                                        .setFooter("Click the button to be reminded.", client.user.displayAvatarURL()),
                                    components: [row]
                                })
                            }


                        }
                    }
                }
            }
        }
        // Timer
        if (voteReminderCounter == 30) {
            voteReminderCounter = 0;
            const query = await voteModel.find({
                fighthub: {
                    voting: {
                        enabled: true,
                        hasVoted: true,
                        lastVoted: {
                            $lt: new Date().getTime()
                        }
                    }
                }
            })

            if (!query.length) return;

            for (const q of query) {
                await sleep(2500)
                const user = client.users.cache.get(q.userId) || null
                if (!user) {
                    q.fighthub.voting.hasVoted = false
                    q.save()
                } else {
                    user.send(
                        new MessageEmbed()
                            .setTitle("Vote Reminder")
                            .setColor("GREEN")
                            .setTimestamp()
                            .setDescription("You can vote for **[FightHub](https://discord.gg/fight)** now!\nClick **[here](https://top.gg/servers/824294231447044197/vote)** to vote!\n\nOnce you vote, you will be reminded again after 12 hours. Thanks for your support! You can toggle vote reminders by running \`fh voterm\`")
                            .setThumbnail(client.storage.fighthub.iconURL())
                    )

                    q.fighthub.voting.hasVoted = false;
                    q.save()
                }
            }
        }

        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
