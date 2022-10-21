const {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle,
} = require('discord.js')
const serverSettings = require('../database/models/settingsSchema')
const skulls = require('../database/models/skullboard')
module.exports = {
    name: 'messageReactionRemove',
    once: false,
    async execute(reaction, user, client) {
        console.log(`Reaction Removed; name: ${reaction.emoji.name}`)
        if (reaction.emoji.name !== '💀') return

        const message = reaction.message
        const valid = await serverSettings.findOne({
            guildID: message.guild.id,
        })
        if (!valid) return
        if (!valid?.skullBoard.enabled) return

        const { count, channelId } = valid.skullBoard
        if (reaction.count < count) {
            const exists = await skulls.findOne({
                messageId: message.id,
            })
            if (!exists) return
            const mesId = exists.skullBoardMessageId
            if (exists) {
                skulls.deleteOne({
                    messageId: message.id,
                })
                const c = client.channels.cache.get(valid.skullBoard.channelId)
                const m = await c.messages.fetch(mesId)
                if (!m) return

                m.delete()
                return
            }
        }
    },
}
