const {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle,
    TextChannel,
} = require('discord.js')
const noSpam = []
const serverSettings = require('../database/models/settingsSchema')
const skulls = require('../database/models/skullboard')
module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user, client) {
        if (reaction.emoji.name !== '💀') return

        const message = reaction.message
        const valid = await serverSettings.findOne({
            guildID: message.guild.id,
        })
        if (!valid) return
        if (!valid?.skullBoard.enabled) return
        const { count, channelId } = valid.skullBoard
        const rec = await reaction.fetch()
        if (rec.count < count) return
        let exists = await skulls.findOne({
            messageId: message.id,
        })
        if (exists) {
            console.log('it exists')
            exists.count++
            const c = client.channels.cache?.get(channelId)
            let msg = await c.messages.fetch(exists.skullBoardMessageId)
            console.log(msg)
            const ee = EmbedBuilder.from(msg.embeds[0])
            ee.setTitle(`**${reaction.count} :skull:**`)
            //msg.embeds[0].setTitle(`**${exists.count} :skull:**`)
            msg.edit({
                embeds: [ee],
            })
            exists.save()
            return
        } else {
            if (noSpam.includes(message.id)) {
                return
            } else {
                noSpam.push(message.id)
            }
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
            .setTitle(`**${reaction.count} :skull:**`)
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
        noSpam = noSpam.filter((a) => a !== message.id)
    },
}
