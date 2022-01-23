const { Message, Client } = require('discord.js')
let cds = []
module.exports = {
    name: 'messageCreate',
    /**
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        if (message.guild.id !== '824294231447044197') return
        for (const trigger of client.db.ars) {
            if (
                message.content.includes(trigger) &&
                !cds.includes(`${message.channel.id}.${trigger}`)
            ) {
                cds.push(`${message.channel.id}.${trigger}`)
                message.reply(trigger.response)
                await sleep(5000)
                cds = cds.filter(
                    (v) => v !== `${message.channel.id}.${trigger}`
                )
            }
        }
    },
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
