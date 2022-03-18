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
                            .setColor('YELLOW')
                            .setDescription(
                                `<t:${(
                                    (new Date().getTime() - reminder.time) /
                                    1000
                                ).toFixed(
                                    0
                                )}:R> you asked me to remind you about "${
                                    reminder.reason
                                }"`
                            )
                            .addField(
                                'Message Link',
                                `[Jump](${reminder.link})`
                            )
                            .setTimestamp(),
                    ],
                })
                const db = require('../database/models/remind')
                db.deleteOne(
                    {
                        userId: reminder.userId,
                        time: reminder.time,
                    },
                    {},
                    {}
                )
                client.db.reminders = client.db.reminders.filter(
                    (a) =>
                        a.userId !== reminder.userId && a.time !== reminder.time
                )
            }
        }
    },
}
