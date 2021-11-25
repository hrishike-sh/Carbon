const { Client, Message, MessageEmbed } = require('discord.js');
const ms = require('ms');
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
        if (!message.member.permissions.has("MANAGE_MESSAGES")) {
            return message.channel.send(`You must have the \`MANAGE_MESSAGES\` permission to run this command.`)
        }

        if (!args[0]) return message.channel.send("Please specify the time.\nExample: \`fh timer 30s\`")

        const time = new Date().getTime() + ms(args[0])

        if (isNaN(time)) {
            return message.channel.send(`Please provide a valid time.\nExample: \`fh timer 30s\``)
        }

        args.shift()

        const reason = args.join(" ") || "Timer"

        const timer = new db({
            time,
        })
        timer.save()
        message.delete()
        return message.channel.send(
            new MessageEmbed()
                .setAuthor(message.member.displayName, message.author.displayAvatarURL())
                .setTitle(reason)
                .setDescription(`${ms(ms(time - new Date().getTime()), { long: true })} left...`)
                .setFooter("Click the button to be reminded", client.user.displayAvatarURL())
        )
    }
}