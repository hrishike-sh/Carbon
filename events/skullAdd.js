const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js')
const serverSettings = require('../database/models/settingsSchema')
const skulls = require('../database/models/skullboard')
module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user, client) {
        console.log(`Reaction Added; name: ${reaction.emoji.name}`)
        if (reaction.emoji.name !== '💀') return

        const message = reaction.message
        const valid = await serverSettings.findOne({
            guildID: message.guild.id,
        })
        if (!valid) return
        if (!valid?.skullBoard.enabled) return

        const { count, channelId } = valid.skullBoard
        if (reaction.count < count) return

        let exists = await skulls.findOne({
            messageId: message.id,
        })
        if (exists) {
            exists.count++
            const c = client.channels.cache?.get(channelId)
            let msg = c.messages.fetch(exists.skullBoardMessageId)
            msg.embeds[0].setTitle(`**${exists.count} :skull:**`)
            msg.edit({
                embeds: msg.embeds,
            })
            exists.save()
            return
        } else {
            exists = {
                messageId: message.id,
                count: reaction.count,
            }
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL(),
                url: message.url,
            })
            .setDescription(message.content || ' ')
            .setImage(message.attachments.first()?.url)
            .setFooter({
                text: 'Use this in your own server by using `/skullboard`!',
            })
            .setTitle(`**${exists.count.toLocaleString()} :skull:**`)
        const channel = client.channels.cache.get(channelId)
        if (!channel) return

        const temp = await channel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setEmoji('💀')
                        .setStyle(5)
                        .setURL(message.url)
                        .setLabel('Message'),
                ]),
            ],
        })

        const z = new skulls({
            messageId: message.id,
            channelId: message.channel.id,
            authorId: message.author.id,
            guildId: message.guild.id,
            count: reaction.count,
            skullBoardMessageId: temp.id,
        })
        z.save()
    },
}
