const { Message } = require('discord.js')

module.exports = {
    name: 'link',
    /**
     *
     * @param {Message} message
     */
    async execute(message) {
        if (!message.reference) return message.reply('Must reply to a message.')
        const msg = await message.channel.messages.fetch(
            message.reference.messageId
        )

        if (msg.author.id !== '270904126974590976' || !msg.embeds.length) {
            return message.reply(
                'The message should be sent by Dank Memer and it should have embeds.'
            )
        }

        return message.reply(msg.embeds[0].thumbnail || 'No link found.')
    },
}
