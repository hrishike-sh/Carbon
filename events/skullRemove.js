const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const serverSettings = require('../database/models/settingsSchema')
const skulls = require('../database/models/skullboard')
module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user, client) {
        if (reaction.name !== 'skull') return

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

                const m = client.channels.cache
                    .get(valid.skullBoard.channelId)
                    .messages.fetch(mesId)
                if (!m) return

                m.delete()
                return
            }
        }
    },
}