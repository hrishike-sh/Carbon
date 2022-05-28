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
                const user = await client.users.fetch(reminder.userId)
                if (!user) await removeEntry(id, client)

                try {
                    await user.send({
                        embeds: [
                            new MessageEmbed()
                                .setTimestamp()
                                .setTitle(':clock: Reminder :clocl:')
                                .setDescription(
                                    `${client.functions.formatTime(
                                        reminder.time
                                    )} (${client.functions.formatTime(
                                        reminder.time,
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
