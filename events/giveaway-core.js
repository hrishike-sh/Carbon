const {
    MessageButton,
    Client,
    MessageEmbed,
    Interaction,
    MessageActionRow,
    ButtonInteraction,
} = require('discord.js')
const giveawayModel = require('../database/models/giveaway')
const bypassIds = ['825965323500126208', '876460154705555487']
module.exports = {
    name: 'interactionCreate',
    once: false,
    /**
     *
     * @param {ButtonInteraction} button
     * @param {Client} client
     * @returns
     */
    async execute(button, client) {
        if (!button.isButton()) return
        if (
            button.customId !== 'giveaway-join' &&
            button.customId !== 'giveaway-info' &&
            button.customId !== 'giveaway-reroll' &&
            button.customId !== 'giveaway-leave'
        )
            return

        const gaw = await giveawayModel.findOne({
            messageId: button.message.id,
        })

        if (button.customId === 'giveaway-join') {
            if (gaw.hasEnded) {
                button.message.edit({
                    content: `🎉 Giveaway Ended 🎉`,
                    embeds: [
                        new MessageEmbed()
                            .setTitle(gaw.prize)
                            .setFooter({
                                text: `Winners: ${gaw.winners} | Ended at`,
                            })
                            .setTimestamp()
                            .setColor('NOT_QUITE_BLACK')
                            .setDescription(
                                `Winner(s): Couldn't fetch\nHost: <@${gaw.hosterId}>`
                            )
                            .setFields(button.message.embeds[0].fields),
                    ],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setLabel(
                                    `🎉 ${gaw.entries.length.toLocaleString()}`
                                )
                                .setCustomId('giveaway-join')
                                .setStyle('PRIMARY')
                                .setDisabled(),
                        ]),
                    ],
                })

                return button.reply({
                    content: 'This giveaway has already ended :pray:',
                    ephemeral: true,
                })
            }
            if (gaw.entries.includes(button.user.id)) {
                button.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('You have already joined this giveaway!')
                            .setDescription(
                                'You can only join once... and you are already in!'
                            )
                            .setColor('YELLOW'),
                    ],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setLabel('Leave giveaway')
                                .setCustomId('giveaway-leave')
                                .setStyle('DANGER'),
                        ]),
                    ],
                    ephemeral: true,
                })
                return
            }
            if (gaw.requirements.length > 0) {
                const requirements = gaw.requirements

                let canJoin = true

                for (const req of requirements) {
                    if (!canJoin) continue
                    if (!button.member.roles.cache.has(req)) canJoin = false
                }
                if (button.member.roles.cache.hasAny(...bypassIds))
                    canJoin = true
                if (!canJoin) {
                    return button.reply({
                        content:
                            'You do not meet the requirements to join this giveaway!',

                        ephemeral: true,
                    })
                }
            }
            gaw.entries.push(button.user.id)
            gaw.save()

            button.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('🎉You have joined the giveaway!')
                        .setDescription(
                            `You will receive a DM if you win.\nThe chances of you winning this giveaway are **${(
                                (1 / gaw.entries.length) *
                                100
                            ).toFixed(3)}%**!`
                        )
                        .setColor('GREEN'),
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Leave giveaway')
                            .setCustomId('giveaway-leave')
                            .setStyle('DANGER'),
                    ]),
                ],
                ephemeral: true,
            })
        } else if (button.customId === 'giveaway-reroll') {
            const giveawayMessageId =
                button.message.components[0].components[0].url
                    .split('/')
                    .slice(-1)[0]
            const gaww = await giveawayModel.findOne({
                messageId: giveawayMessageId,
            })
            if (button.user.id !== gaww.hosterId) {
                return button.reply({
                    content: `Only the host of the giveaway can reroll winners...`,
                    ephemeral: true,
                })
            }

            const winner = `<@${
                gaww.entries[Math.floor(Math.random() * gaww.entries.length)]
            }>`
            button.deferUpdate()

            const embed = new MessageEmbed()
                .setTitle('🎊 You have won a giveaway! 🎊')
                .setDescription(
                    `You have won the *reroll* for the giveaway **\`${gaww.prize}\`**!`
                )
                .addField('Host', `<@${gaww.hosterId}>`, true)
                .addField(
                    'Giveaway Link',
                    `[Jump](https://discord.com/channels/${gaww.guildId}/${gaww.channelId}/${gaww.messageId})`,
                    true
                )
                .setColor('GREEN')
                .setTimestamp()
            const id = winner.replace('<@', '').replace('>', '')
            client.functions.dmUser(client, id, {
                content: `<@${id}>`,
                embeds: embed,
            })
            await button.channel.send({
                content: `${winner}\nYou have won the reroll for **${
                    gaww.prize
                }**! Your chances of winning the giveaway were **${(
                    (1 / gaww.entries.length) *
                    100
                ).toFixed(3)}%**`,
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Jump')
                            .setStyle('LINK')
                            .setURL(
                                `https://discord.com/channels/${gaww.guildId}/${gaww.channelId}/${gaww.messageId}`
                            ),
                        new MessageButton()
                            .setLabel('Reroll')
                            .setCustomId('giveaway-reroll')
                            .setStyle('SECONDARY'),
                    ]),
                ],
            })
        } else if (button.customId === 'giveaway-leave') {
            const messageId = button.message.reference.messageId
            const gaw = await giveawayModel.findOne({ messageId })
            if (!gaw) return
            if (!gaw.entries.includes(button.user.id)) {
                return button.reply({
                    content: 'You have not joined this giveaway.',
                    ephemeral: true,
                })
            }

            gaw.entries.splice(gaw.entries.indexOf(button.user.id), 1)
            gaw.save()

            return button.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription('You have left the giveaway')
                        .setColor('RED'),
                ],
                ephemeral: true,
            })
        }
    },
}
