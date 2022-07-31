const { Message, Client, Collection } = require('discord.js')
const DB = require('../database/models/token')
const token = `<:token:1003272629286883450>`
const talked = new Collection()
/**
 * Sample collection:
 * lastTalked: timestamp,
 * messageCount: number
 */

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     *
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        if (message.guildId !== '824294231447044197') return // no fh no fun
        if (message.author.bot) return // ok

        // fancy
        const userId = message.author.id
        // fancy
        if (!talked.has(userId)) {
            talked.set(userId, {
                lastTalked: new Date().getTime(),
                lastMessageContent: '',
                messageCount: 0,
            })
        }

        const user = talked.get(userId)
        if (new Date().getTime() - user.lastTalked < 500) {
            // anti spam
            return
        }
        if (user.lastMessageContent == message.content) return // more anti spam

        user.messageCount++
        user.lastTalked = new Date().getTime()
        if (user.messageCount > 9) {
            user.messagecount = 0
            const amt = Math.ceil(Math.random() * 5)
            return await addTokens(userId, amt)
        }
    },
}

const addTokens = async (userId, amt) => {
    await DB.findOneAndUpdate(
        {
            userId,
        },
        {
            $inc: {
                tokens: amt,
            },
        },
        {
            upsert: true,
        }
    )
}
