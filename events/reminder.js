const {
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const Database = require('../database/models/remind')
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
                if (!user) {
                    Database.deleteOne({
                        id: reminder.id,
                    })
                    continue
                }
                const embed = new MessageEmbed()
                    .setTitle('⏰ Reminder')
                    .setDescription(
                        `${client.functions.formatTime(
                            reminder.time,
                            'R'
                        )} you asked me to remind you about **${
                            reminder.reason
                        }**`
                    )
                    .setColor('GREEN')
                    .setTimestamp()
                user.send({
                    embeds: [embed],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setStyle('LINK')
                                .setLabel('Message')
                                .setURL(reminder.link),
                        ]),
                    ],
                })
                Database.deleteOne({
                    id: reminder.id,
                })
                client.db.reminders = client.db.reminders.filter(
                    (a) => a.id === reminder.id
                )
                continue
            }
        }
    },
}
