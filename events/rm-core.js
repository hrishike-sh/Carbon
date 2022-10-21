const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
                            new EmbedBuilder()
                                .setTimestamp()
                                .setTitle(
                                    ':alarm_clock: Reminder :alarm_clock:'
                                )
                                .setDescription(
                                    `${client.functions.formatTime(
                                        new Date().getTime() -
                                            (new Date().getTime() -
                                                reminder.time)
                                    )} (${client.functions.formatTime(
                                        new Date().getTime() -
                                            (new Date().getTime() -
                                                reminder.time),
                                        'f'
                                    )}) you asked me to remind you about **${
                                        reminder.reason
                                    }**!`
                                )
                                .setColor('Green'),
                        ],
                        components: [
                            new ActionRowBuilder().addComponents([
                                new ButtonBuilder()
                                    .setLabel('Message')
                                    .setStyle(ButtonStyle.Link)
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
