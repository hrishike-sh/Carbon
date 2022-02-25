const { MessageActionRow, MessageButton, Message } = require('discord.js')

module.exports = {
    name: 'invite',
    aliases: ['inv'],
    description: 'Invite the bot.',
    category: 'Other',
    /**
     *
     * @param {Message} message
     * @param {*} args
     */
    execute(message, args) {
        const but = new MessageButton()
            .setLabel('Invite')
            .setStyle('LINK')
            .setURL(
                'https://discord.com/api/oauth2/authorize?client_id=855652438919872552&permissions=140257912897&scope=bot'
            )
        const row = new MessageActionRow().addComponents([but])

        message.channel.send({
            content: 'You can invite me by using the button.',
            components: [row],
        })
    },
}
