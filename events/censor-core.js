const { Message, Client, EmbedBuilder } = require('discord.js')

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
        if (message.member.permissions.has('ManageMessages')) return

        const censors = client.db.censors

        for (const censor of censors) {
            if (censor.type === 'string') {
                if (
                    message.content
                        .toLowerCase()
                        .includes(censor.censor.toLowerCase())
                ) {
                    message.member.timeout(
                        600000,
                        `Message contains censored word. (${censor.censor})`
                    )

                    const msg = message.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    '<:fh_timeout:952067949538181130> Timeout'
                                )
                                .setColor('Red')
                                .setDescription(
                                    `${message.member.toString()} has been timed out for **10 minutes** for saying a censored word!`
                                )
                                .setTimestamp(),
                        ],
                        content: `${message.member.toString()}`,
                    })
                    await client.functions.sleep(2500)
                    ;(await msg).delete().catch((e) => null)
                }
            } else if (censor.type === 'regex') {
                if (message.content.test(censor.censor)) {
                    message.member.timeout(
                        600000,
                        `Message contains censored word. (${censor.name})`
                    )

                    const msg = message.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    '<:fh_timeout:952067949538181130> Timeout'
                                )
                                .setColor('Red')
                                .setDescription(
                                    `${message.member.toString()} has been timed out for **10 minutes** for saying a censored word!`
                                )
                                .setTimestamp(),
                        ],
                        content: `${message.member.toString()}`,
                    })
                    await client.functions.sleep(2500)
                    ;(await msg).delete().catch((e) => null)
                }
            }
        }
    },
}
