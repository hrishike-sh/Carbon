const giveawayModel = require('../database/models/giveaway')

module.exports = {
    name: 'clickButton',
    once: false,
    async execute(button, client) {
        if (button.id !== 'giveaway-join' && button.id !== 'giveaway-info')
            return

        const gaw = await giveawayModel.findOne({
            messageId: button.message.id,
        })

        if (!gaw) return

        if (button.id === 'giveaway-join') {
            if (gaw.entries.includes(button.user.id)) {
                button.reply.send(
                    'You have already entered this giveaway.',
                    true
                )
                return
            }
            if (gaw.requirements) {
                const requirements = gaw.requirements
                let canJoin = true
                for (const req of requirements) {
                    if (!canJoin) continue
                    if (!button.member._roles.includes(req)) canJoin = false
                }
                if (!canJoin)
                    return button.reply.send(
                        `You do not meet the requirements to join the giveaway!`,
                        true
                    )
            }
            gaw.entries.push(button.user.id)
            gaw.save()

            button.reply.send('Your entry has been counted, good luck!', true)
        } else if (button.id === 'giveaway-info') {
            const info = {
                joined: gaw.entries.includes(button.user.id) ? '✅' : '❌',
                chances: ((1 / gaw.entries.length) * 100).toFixed(3),
                entries: gaw.entries.length.toLocaleString(),
                ended: `${gaw.hasEnded}`,
            }

            button.reply.send({
                embed: {
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
                ephemeral: true,
            })
        }
    },
}
