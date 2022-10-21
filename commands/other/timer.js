const {
    Client,
    Message,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
} = require('discord.js')
const ms = require('better-ms')
const db = require('../../database/models/timer')
module.exports = {
    name: 'timer',
    fhOnly: false,
    disabledChannels: [],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.channel.send(
                `You must have the \`MANAGE_MESSAGES\` permission to run this command.`
            )
        }

        if (!args[0])
            return message.channel.send(
                'Please specify the time.\nExample: `fh timer 30s`'
            )

        const time = new Date().getTime() + ms.ms(args[0])

        if (isNaN(time)) {
            return message.channel.send(
                `Please provide a valid time.\nExample: \`fh timer 30s\``
            )
        }

        args.shift()

        const reason = args.join(' ') || 'Timer'

        const timer = new db({
            time,
            channelId: message.channel.id,
            member: message.author,
            reason,
            reminders: [],
            ended: false,
        })
        message.delete()
        const RemindBut = new ButtonBuilder()
            .setEmoji('🔔')
            .setStyle(ButtonStyle.Success)
            .setCustomId('remind_me')
        const row = new ActionRowBuilder().addComponents([RemindBut])
        const msg = await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(reason)
                    .setDescription(
                        `Ends ${client.functions.formatTime(time, 'R')}`
                    )
                    .setTimestamp(),
            ],
            components: [row],
        })

        timer.messageId = msg.id
        timer.save()
        return
    },
}
