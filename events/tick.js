const { Client } = require("discord.js");
const giveawayModel = require('../database/models/giveaway')

const { MessageActionRow, MessageButton } = require('discord-buttons')
let i = 0;
let presenceCounter1 = 0;
let presenceCounter2 = 0;
let gawCounter1 = 0;
module.exports = {
    name: 'tick',
    once: false,
    /**
     * @param {Client} client 
     */
    async execute(client) {

        // Incrementing everything
        presenceCounter1++
        gawCounter1++
        // Incrementing everything
        console.log(`Presence ${presenceCounter1}`)
        console.log(`Gaw ${gawCounter1}`)
        // Presence
        const presences = [
            {
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
                endsAt: { $lte: new Date().getTime() },
                hasEnded: false
            });

            if (!gaws || !gaws.length) {
                setTimeout(() => {
                    client.emit('tick')
                }, 1000)
                return;
            }

            for (const giveaway of gaws) {

                giveaway.hasEnded = true;
                giveaway.save()

                const channel = await client.channels.cache.get(`${giveaway.channelId}`)
                if (!channel) {
                    setTimeout(() => {
                        client.emit('tick')
                    }, 1000)
                    return
                }

                const message = await channel.messages.fetch(`${giveaway.messageId}`)
                if (!message) {
                    setTimeout(() => {
                        client.emit('tick')
                    }, 1000)
                    return
                }

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
                        fields: [
                            {
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
        // Giveaways


        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    }
}