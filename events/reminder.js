const { Client, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'tick',
    /**
     * @param {Client} client
     */
    async execute(client) {
        const reminders = client.db.reminders

        const expired = reminders.filter((rm) => rm.time < new Date().getTime())

        if (expired.length) {
            for (const reminder of expired) {
                const user = await client.users.fetch(reminder.userId)
                if (!user) continue

                user.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle('Reminder')
                            .setColor('DARK_BUT_NOT_BLACK')
                            .setDescription(
                                `<t:${(reminder.time / 1000).toFixed(
                                    0
                                )}:r> you asked me to remind you about "${
                                    reminder.reason
                                }"`
                            )
                            .addField('Message Link', reminder.link),
                    ],
                })
            }
        }
    },
}
