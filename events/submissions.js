const {
    ButtonInteraction,
    Client,
    MessageActionRow,
    MessageButton,
} = require('discord.js')

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {ButtonInteraction} button
     * @param {Client} client
     */
    async execute(button, client) {
        if (!button.isButton()) return
        if (button.channel.id !== '924850616411504710') return

        const adminRole = '824348974449819658'

        if (!button.member.roles.cache.has(adminRole)) {
            return button.reply({
                content: `You must have the <@&${adminRole}> role to accept/deny submissions!`,
                ephemeral: true,
            })
        }

        const id = button.customId
        const user = client.users.fetch(
            button.message.embeds[0].footer.text.split(':')[1],
            { cache: true }
        )
        const embed = button.message.embeds[0]
        if (id === 'accept-submit') {
            const comp = button.message.components
            comp.forEach((sus) => {
                sus.setDisabled()
            })
            embed.setColor('GREEN')
        } else {
            embed.setColor('RED')
            button.message
                .edit({
                    embeds: [
                        {
                            title: 'Denied',
                            description: `Denied by: **${
                                button.user.tag
                            }**\nTime: <t:${(
                                new Date().getTime() / 1000
                            ).toFixed(0)}:R>\n\nThe user was DM'd about this.`,
                        },
                        embed,
                    ],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setLabel('Accept')
                                .setCustomId('accept-submit')
                                .setStyle('SUCCESS')
                                .setDisabled(),
                            new MessageButton()
                                .setStyle('DANGER')
                                .setLabel('Deny')
                                .setCustomId('deny-submit')
                                .setDisabled(),
                        ]),
                    ],
                })(await user)
                .send({
                    embeds: [
                        {
                            title: 'Submission update',
                            description: `Your submission for the event was __denied__.\n\nDenied by: ${button.user.tag}`,
                            timestamp: new Date(),
                            color: 'RED',
                        },
                    ],
                })
        }
    },
}
