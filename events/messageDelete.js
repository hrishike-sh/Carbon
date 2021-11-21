const { Message, Client } = require('discord.js')

module.exports = {
    name: 'messageDelete',
    once: false,
    /**
     * 
     * @param {Message} message 
     * @param {Client} client 
     */
    execute(message, client) {
        let snipes = client.snipes.get(message.channel.id) || []

        if (snipes.length > 5) snipes = snipes.slice(0, 4);

        snipes.unshift({
            msg: message,
            image: message.attachments.first()?.proxyURL || null,
            time: Date.now()
        });

        client.snipes.set(message.channel.id, snipes)

    }
}