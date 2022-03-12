const { Message, Client } = require('discord.js')

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     *
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        if (message.guild.id !== client.db.fighthub.id) return
        if (message.author.bot) return
        // if(message.member.permissions.has("MANAGE_MESSAGES")) return

        const censors = client.db.censors

        for (const censor in censors) {
            console.log(censor)
            if (censor.type === 'string') {
                if (
                    message.content
                        .toLowerCase()
                        .includes(censor.censor.toLowerCase())
                ) {
                    console.log('Contains censored word!')
                }
            } else if (censor.type === 'regex') {
                if (message.content.test(censor.censor)) {
                    console.log('Contains censored word regex!')
                }
            }
        }
    },
}
