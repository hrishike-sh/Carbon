const db = require('../../database/models/settingsSchema')
const { MessageButton, MessageActionRow } = require('discord.js')

module.exports = {
    name: 'unlockdown',
    async execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(
                `You must have the ADMINISTATOR permission to run this command`
            )

        const server = await db.findOne({ guildID: message.guild.id })

        if (!server || !server.lockdownSet.channels)
            return message.channel.send(
                `This server has not yet set the channels that are supposed to be locked down.\nCheck \`fh lds\` for more info.`
            )

        const yesbut = new MessageButton()
            .setLabel('Yes')
            .setStyle('SUCCESS')
            .setCustomId('lock-yes')
        const nobut = new MessageButton()
            .setLabel('No')
            .setStyle('DANGER')
            .setCustomId('lock-no')
        const row1 = new MessageActionRow().addComponents([yesbut, nobut])

        const confirm = await message.channel.send(
            `Are you sure you want to unlock the server?`,
            { components: row1 }
        )

        const collectorC = confirm.createButtonCollector((b) => b, {
            time: 30000,
            max: 1,
        })

        collectorC.on('collect', async (button) => {
            if (button.clicker.user.id !== message.author.id) {
                button.reply.send(`This is not for you`, true)
                return
            }

            const id = button.id

            if (id === 'lock-no') {
                confirm.delete()
                return message.channel.send(`I guess not.`)
            } else if (id === 'lock-yes') {
                const channels = server.lockdownSet.channels

                for (const channel of channels) {
                    const toLockChannel =
                        message.guild.channels.cache.get(channel)

                    toLockChannel.updateOverwrite(
                        message.channel.guild.roles.everyone,
                        {
                            SEND_MESSAGES: null,
                        }
                    )

                    toLockChannel.send({
                        embed: {
                            title: ':unlock: **SERVER UNLOCKED**',
                            description: `The server is now unlocked.`,
                            color: 'GREEN',
                            timestamp: new Date(),
                        },
                    })
                }

                message.channel.send(`Done, the server is now unlocked!`)
            }
        })
    },
}
