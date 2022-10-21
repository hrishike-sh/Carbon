const {
    ButtonBuilder,
    Client,
    EmbedBuilder,
    Interaction,
    ActionRowBuilder,
    ButtonInteraction,
    Message,
    Collection,
    ButtonStyle,
} = require('discord.js')
const { Model } = require('mongoose')
const giveawayModel = require('../database/models/giveaway')
const server = require('../database/models/settingsSchema')
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
            button.customId !== 'giveaway-leave' &&
            button.customId !== 'giveaway-thank'
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
                        new EmbedBuilder()
                            .setTitle(gaw.prize)
                            .setFooter({
                                text: `Winners: ${gaw.winners} | Ended at`,
                            })
                            .setTimestamp()
                            .setColor('NotQuiteBlack')
                            .setDescription(
                                `Winner(s): ${
                                    gaw.WWinners.map((w) => `<@${w}>`).join(
                                        ' '
                                    ) || "Couldn't fetch!"
                                }\nHost: <@${gaw.hosterId}>`
                            )
                            .setFields(button.message.embeds[0].fields),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents([
                            new ButtonBuilder()
                                .setLabel(
                                    `🎉 ${gaw.entries.length.toLocaleString()}`
                                )
                                .setCustomId('giveaway-join')
                                .setStyle(ButtonStyle.Primary)
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
                        new EmbedBuilder()
                            .setTitle('You have already joined this giveaway!')
                            .setDescription(
                                'You can only join once... and you are already in!'
                            )
                            .setColor('Yellow'),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents([
                            new ButtonBuilder()
                                .setLabel('Leave giveaway')
                                .setCustomId('giveaway-leave')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setLabel('Thank the sponsor')
                                .setEmoji('♥')
                                .setCustomId('giveaway-thank')
                                .setStyle(ButtonStyle.Primary),
                        ]),
                    ],
                    ephemeral: true,
                })
                return
            }
            let bypass = false
            let blRoles = []
            blRoles =
                (await server.findOne({ guildID: button.guildId }))
                    ?.giveaway_config?.blacklisted_roles || []
            if (
                blRoles.length &&
                button.member.roles.cache.hasAny(...blRoles)
            ) {
                return button.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('You have been blacklisted.')
                            .setDescription(
                                `You have one of these roles which do not allow you to enter giveaways:\n${blRoles
                                    .map((a) => `<@&${a}>`)
                                    .join(`\n`)}`
                            ),
                    ],
                    ephemeral: true,
                })
            }
            if (gaw.requirements.length > 0) {
                const requirements = gaw.requirements
                let bypassIds = []
                bypassIds =
                    (await server.findOne({ guildID: button.guildId }))
                        ?.giveaway_config?.bypass_roles || []
                let canJoin = true
                let noroles = []
                for (const req of requirements) {
                    if (!button.member.roles.cache.has(req)) {
                        noroles.push(req)
                        canJoin = false
                    }
                }
                if (
                    bypassIds.length &&
                    button.member.roles.cache.hasAny(...bypassIds)
                ) {
                    canJoin = true
                    bypass = true
                }

                if (!canJoin) {
                    return button.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    `You cannot join this giveaway :frowning2:`
                                )
                                .setDescription(
                                    `You do not have the following roles:\n${noroles
                                        .map((a) => `<@&${a}>`)
                                        .join(`\n`)}`
                                )
                                .setColor('Red'),
                        ],
                        ephemeral: true,
                    })
                }
            }

            await giveawayModel.findOneAndUpdate(
                {
                    messageId: gaw.messageId,
                },
                {
                    $push: {
                        entries: `${button.user.id}`,
                    },
                }
            )

            button.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            bypass
                                ? `You have bypassed this giveaway with your cool perks :sunglasses:`
                                : `🎉 You have joined this giveaway 🎉`
                        )
                        .setDescription(
                            `You will receive a DM if you win.\nThe chances of you winning this giveaway are **${(
                                (1 / (gaw.entries.length + 1)) *
                                100
                            ).toFixed(2)}%***!`
                        )
                        .setColor('Green')
                        .setFooter({
                            text: '*Winning chance may change overtime!',
                        }),
                ],
                components: [
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder()
                            .setLabel('Leave giveaway')
                            .setCustomId('giveaway-leave')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setLabel('Thank the sponsor')
                            .setEmoji('♥')
                            .setCustomId('giveaway-thank')
                            .setStyle(ButtonStyle.Primary),
                    ]),
                ],
                ephemeral: true,
            })
            editCount(button.message, gaw)
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

            const embed = new EmbedBuilder()
                .setTitle('🎊 You have won a giveaway! 🎊')
                .setDescription(
                    `You have won the *reroll* for the giveaway **\`${gaww.prize}\`**!`
                )
                .addFields([
                    {
                        name: 'Host',
                        value: `<@${gaww.hosterId}>`,
                        inline: true,
                    },
                ])
                .addFields([
                    {
                        name: 'Giveaway Link',
                        value: `[Jump](https://discord.com/channels/${gaww.guildId}/${gaww.channelId}/${gaww.messageId})`,
                        inline: true,
                    },
                ])
                .setColor('Green')
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
                    new ActionRowBuilder().addComponents([
                        new ButtonBuilder()
                            .setLabel('Jump')
                            .setStyle(ButtonStyle.Link)
                            .setURL(
                                `https://discord.com/channels/${gaww.guildId}/${gaww.channelId}/${gaww.messageId}`
                            ),
                        new ButtonBuilder()
                            .setLabel('Reroll')
                            .setCustomId('giveaway-reroll')
                            .setStyle(ButtonStyle.Secondary),
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

            await giveawayModel.findOneAndUpdate(
                {
                    messageId: gaw.messageId,
                },
                { $pull: { entries: `${button.user.id}` } }
            )
            editCount(button.message, gaw)
            return button.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('You have left the giveaway')
                        .setColor('Red'),
                ],
                ephemeral: true,
            })
        } else if (button.customId === 'giveaway-thank') {
            const messageId = button.message.reference.messageId
            const gaw = await giveawayModel.findOne({ messageId })
            if (!gaw.sponsor.id) {
                return button.reply({
                    content: 'This feature only works for newer giveaways.',
                    ephemeral: true,
                })
            }
            await giveawayModel.findOneAndUpdate(
                {
                    messageId: gaw.messageId,
                },
                { $inc: { 'sponsor.thanks': 1 } }
            )

            button.reply({
                embeds: [
                    {
                        description: `Thank you for thanking them!\nThey have been thanked ${(
                            gaw.sponsor.thanks + 1
                        ).toLocaleString()} times.`,
                    },
                ],
                ephemeral: true,
            })
            return
        }
    },
}

let beingEdited = new Collection()
/**
 *
 * @param {Message} msg
 * @param {Model} model
 */
const editCount = async (msg, model) => {
    if (beingEdited.get(msg.id)) return
    beingEdited.set(msg.id, true)
    await msg.client.functions.sleep(5000)
    msg.components[0].components[0].setLabel(
        (model.entries.length + 1).toLocaleString()
    )
    await msg.edit({
        components: msg.components,
    })
    beingEdited.delete(msg.id)
}
