const db = require('../../database/models/settingsSchema')
const { MessageButton, MessageActionRow, Message } = require('discord.js')

module.exports = {
    name: 'lockdown',
    /**
     *
     * @param {Message} message
     * @returns
     */
    async execute(message) {
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

        const confirm = await message.channel.send({
            components: [row1],
            content: `Are you sure you want to lockdown?`,
        })

        const collectorC = confirm.createMessageComponentCollector({
            time: 30000,
            max: 1,
        })

        collectorC.on('collect', async (button) => {
            if (button.user.id !== message.author.id) {
                button.reply({
                    content: `This is not for you`,
                    ephemeral: true,
                })
                return
            }

            const id = button.customId

            if (id === 'lock-no') {
                confirm.delete()
                return message.channel.send(`I guess not.`)
            } else if (id === 'lock-yes') {
                button.deferUpdate()
                const channels = server.lockdownSet.channels

                for (const channel of channels) {
                    const toLockChannel =
                        message.guild.channels.cache.get(channel)

                    toLockChannel.permissionOverwrites.edit(
                        message.channel.guild.roles.everyone,
                        {
                            SEND_MESSAGES: false,
                        }
                    )

                    toLockChannel.send({
                        embeds: [
                            {
                                title: ':lock: **SERVER LOCKDOWN**',
                                description:
                                    server.lockdownSet.message ||
                                    'The server is currently locked.',
                                color: 'RED',
                                timestamp: new Date(),
                            },
                        ],
                    })
                }

                message.channel.send('Done, the server is now on lockdown!')
            }
        })
    },
}
