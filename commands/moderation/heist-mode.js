const { Client, Message, EmbedBuilder } = require('discord.js')
const db = require('../../database/models/settingsSchema')
module.exports = {
    name: 'heist-mode',
    aliases: ['heistmode'],
    fhOnly: false,
    category: 'Moderation',
    disabledChannels: [],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            message.channel.send(
                'You need the `ADMINISTRATOR` permission to run this command.'
            )
            return
        }

        let server = await db.findOne({ guildID: message.guild.id })

        if (!server) {
            server = new db({
                guildID: message.guild.id,
                heistMode: {
                    enabled: false,
                    joined: null,
                    left: null,
                },
            })
            server.save()
        }

        const { heistMode } = server

        if (!args[0]) {
            const helpBed = new EmbedBuilder()
                .setAuthor(
                    message.author.tag,
                    message.author.displayAvatarURL()
                )
                .setTitle('Heist Mode')
                .setDescription(
                    "Set this to enabled before your server's heist and the bot will count how many users joined and left your server during the heist!"
                )
                .addField(
                    'fh heistmode on',
                    'Turns on the heist mode in your server. Run this __before__ starting a heist in your server.'
                )
                .addField(
                    'fh heistmode off',
                    'Turns off the heist mode in your server. Run this after your heist is over. This also shows the heist stats.'
                )
                .addField(
                    'fh heistmode stats',
                    'Shows the heist stats IF heist mode is enabled in the server.'
                )
                .setTimestamp()

            return message.channel.send({ embeds: [helpBed] })
        }

        const firstArg = args[0]

        if (firstArg === 'on' || firstArg === 'enable') {
            if (heistMode.enabled) {
                message.channel.send(
                    'Heist mode for this server is already `enabled`.'
                )
                return
            } else {
                heistMode.enabled = true
                heistMode.joined = 0
                heistMode.left = 0
                heistMode.startedOn = new Date().getTime()
                server.save()

                return message.channel.send(
                    `✅ | Heist Mode is now enabled for this server.`
                )
            }
        } else if (firstArg === 'off' || firstArg === 'disable') {
            if (!heistMode.enabled) {
                message.channel.send(
                    `Heist mode for this server is already \`disabled\`.`
                )
                return
            } else {
                heistMode.enabled = false

                const embed = new EmbedBuilder()
                    .setTitle('HeistMode Stats')
                    .setDescription(
                        `The stats for the heist (from <t:${(
                            heistMode.startedOn / 1000
                        ).toFixed(0)}:R>) are:`
                    )
                    .addField(
                        'Members joined',
                        heistMode.joined.toLocaleString(),
                        true
                    )
                    .addField(
                        'Members left',
                        heistMode.left.toLocaleString(),
                        true
                    )
                    .addField(
                        'Net Growth',
                        (heistMode.joined - heistMode.left).toLocaleString(),
                        false
                    )
                    .setTimestamp()
                    .setColor('GREEN')

                server.save()

                return message.channel.send({
                    embeds: [embed],
                    content: `The HeistMode for this server was disabled.`,
                })
            }
        } else if (firstArg === 'stats' || firstArg === 'stat') {
            const embed = new EmbedBuilder()
                .setTitle('HeistMode Stats')
                .setDescription(
                    `The stats for the heist (from <t:${(
                        heistMode.startedOn / 1000
                    ).toFixed(0)}:R>) are:`
                )
                .addField(
                    'Members joined',
                    heistMode.joined.toLocaleString(),
                    true
                )
                .addField('Members left', heistMode.left.toLocaleString(), true)
                .addField(
                    'Net Growth',
                    (heistMode.joined - heistMode.left).toLocaleString(),
                    false
                )
                .setTimestamp()
                .setColor('YELLOW')

            return message.channel.send({
                embeds: [embed],
                content: `Stats for the last/current heist mode.`,
            })
        }
    },
}
