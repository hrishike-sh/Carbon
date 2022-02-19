const {
    MessageButton,
    Client,
    Interaction,
    MessageActionRow,
} = require('discord.js')
const giveawayModel = require('../database/models/giveaway')

module.exports = {
    name: 'interactionCreate',
    once: false,
    /**
     *
     * @param {Interaction} button
     * @param {Client} client
     * @returns
     */
    async execute(button, client) {
        if (!button.isButton()) return
        if (
            button.customId !== 'giveaway-join' &&
            button.customId !== 'giveaway-info' &&
            button.customId !== 'giveaway-reroll'
        )
            return

        const gaw = await giveawayModel.findOne({
            messageId: button.message.id,
        })

        if (button.customId === 'giveaway-join') {
            if (gaw.entries.includes(button.user.id)) {
                button.reply({
                    content: 'You have already entered this giveaway.',
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
                content: 'Your entry has been counted, good luck!',
                ephemeral: true,
            })
        } else if (button.customId === 'giveaway-info') {
            const info = {
                joined: gaw.entries.includes(button.user.id) ? '✅' : '❌',
                chances: ((1 / gaw.entries.length) * 100).toFixed(3),
                entries: gaw.entries.length.toLocaleString(),
                ended: `${gaw.hasEnded}`,
            }

            button.reply({
                embeds: [
                    {
                        title: 'Giveaway Info',
                        color: 'GREEN',
                        description: 'Info for the giveaway:',
                        fields: [
                            {
                                name: 'Joined',
                                value: info.joined,
                            },
                            {
                                name: 'Chances',
                                value: `${info.chances}%`,
                                inline: true,
                            },
                            {
                                name: 'Total entries',
                                value: info.entries,
                            },
                            {
                                name: 'Ended',
                                value: info.ended,
                            },
                        ],
                    },
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
                    content: `Only the hoster of the giveaway can reroll winners...`,
                    ephemeral: true,
                })
            }

            const winner =
                gaww.entries[Math.floor(Math.random() * gaww.entries.length)]

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
                                `https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`
                            ),
                        new MessageButton()
                            .setLabel('Reroll')
                            .setCustomId('giveaway-reroll')
                            .setStyle('SECONDARY'),
                    ]),
                ],
            })
        }
    },
}
