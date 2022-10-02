const { Client, Message, MessageEmbed } = require('discord.js')
const timers = require('../database/models/timer')
const ms = require('better-ms')
let counter = 0
module.exports = {
    name: 'tick',
    /**
     * @param {Client} client
     */
    async execute(client) {
        counter++
        if (counter > 4) {
            counter = 0
        } else return

        const all = await timers.find({
            time: {
                $gte: new Date().getTime(),
            },
            ended: true,
        })
        if (!all.length) return

        for (const timer of all) {
            const t = 300_000
            const n = new Date().getTime()
            console.log('First loop ran')
            if (timer.time - n < t) {
                timer.ended = true
                timer.save()
                console.log('Found timer')
                const channel = client.channels.cache.get(timer.channelId)
                const message = await channel.messages.fetch(timer.messageId)
                if (!message) return
                console.log('Valid message, running loop 2.')
                clearTimer(message, timer.time)
            } else continue
        }
    },
}
/**
 *
 * @param {Message} message
 * @param {Number} time
 */
const clearTimer = async (message, time) => {
    console.log('Loop 2 ran')
    if (time < new Date().getTime()) return
    console.log('Time is valid.')
    const formatted = ms.prettyMs(new Date().getTime() - time, {
        verbose: true,
    })
    message.embeds[0].setDescription(`Ends in ${formatted}`)
    await message.edit({
        embeds: message.embeds,
    })

    setTimeout(clearTimer(message, time), 10_000)
}
