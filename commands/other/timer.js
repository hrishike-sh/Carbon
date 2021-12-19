const { Client, Message, MessageEmbed } = require('discord.js')
const { MessageButton, MessageActionRow } = require('discord-buttons')
const ms = require('pretty-ms')
const ms2 = require('ms')
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
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.channel.send(
                `You must have the \`MANAGE_MESSAGES\` permission to run this command.`
            )
        }

        if (!args[0])
            return message.channel.send(
                'Please specify the time.\nExample: `fh timer 30s`'
            )

        const time = new Date().getTime() + ms2(args[0])

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
        const RemindBut = new MessageButton()
            .setEmoji('🔔')
            .setStyle('green')
            .setID('remind_me')
        const row = new MessageActionRow().addComponents([RemindBut])
        const msg = await message.channel.send({
            embed: new MessageEmbed()
                .setAuthor(
                    message.member.displayName,
                    message.author.displayAvatarURL()
                )
                .setTitle(reason)
                .setDescription(
                    `${ms(time - new Date().getTime(), {
                        verbose: true,
                    })} left...`
                )
                .setTimestamp()
                .setFooter(
                    'Click the button to be reminded',
                    client.user.displayAvatarURL()
                ),
            components: [row],
        })

        timer.messageId = msg.id
        timer.save()
        return
    },
}
