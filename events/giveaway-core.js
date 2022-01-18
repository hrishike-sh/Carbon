const { MessageButton, Client, Interaction } = require('discord.js')
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
            button.customId !== 'giveaway-info'
        )
            return

        const gaw = await giveawayModel.findOne({
            messageId: button.message.id,
        })

        if (!gaw) return

        if (button.customId === 'giveaway-join') {
            if (gaw.entries.includes(button.user.id)) {
                button.reply('You have already entered this giveaway.', true)
                return
            }
            if (gaw.requirements.length > 0) {
                const requirements = gaw.requirements

                if (!button.member.roles.cache.hasAll(requirements)) {
                    return button.reply({
                        content: `You do not have the requirements to join this giveaway!`,
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
        }
    },
}
