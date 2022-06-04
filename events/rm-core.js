const {
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const db = require('../database/models/remind')
let processing = false
module.exports = {
    name: 'tick',
    /**
     * @param {Client} client
     */
    async execute(client) {
        if (processing) return
        const all = client.db.reminders
        if (!all.length) return
        const remind = all.filter((a) => a.time < new Date().getTime())
        processing = true
        ;(async () => {
            for (const reminder of remind) {
                await removeEntry(reminder.id, client)
                const user = await client.users.fetch(reminder.userId)
                if (!user) continue

                try {
                    await user.send({
                        embeds: [
                            new MessageEmbed()
                                .setTimestamp()
                                .setTitle(
                                    ':alarm_clock: Reminder :alarm_clock:'
                                )
                                .setDescription(
                                    `${client.functions.formatTime(
                                        reminder.time - new Date().getTime()
                                    )} (${client.functions.formatTime(
                                        reminder.time - new Date().getTime(),
                                        'f'
                                    )}) you asked me to remind you about **${
                                        reminder.reason
                                    }**!`
                                )
                                .setColor('GREEN'),
                        ],
                        components: [
                            new MessageActionRow().addComponents([
                                new MessageButton()
                                    .setLabel('Message')
                                    .setStyle('LINK')
                                    .setURL(reminder.link),
                            ]),
                        ],
                    })
                } catch (e) {
                    console.log(e)
                } finally {
                    continue
                }
            }
        })()
        processing = false
    },
}

const removeEntry = async (id, client) => {
    await db.deleteMany({
        id,
    })

    client.db.reminders = client.db.reminders.filter((a) => a.id !== id)
}
