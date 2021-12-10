const { Client, Message, MessageEmbed } = require('discord.js');
const db = require('../../database/models/settingsSchema')
module.exports = {
    name: 'disabledDrop',
    aliases: 'disablehere',
    fhOnly: true,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {

        if (!message.member.permissions.has("ADMINISTRATOR")) {
            message.channel.send("You need the \`ADMINISTATOR\` permission to run this command.")
            return;
        }

        const server = await db.findOne({ guildID: message.guild.id })

        if (!server.disabledDrop) server.disabledDrop = []

        const channel = message.channel

        if (server.disabledDrop.includes(channel.id)) {
            return message.channel.send("That channel is already drop ignored.")
        }

        server.disabledDrop.push(channel.id)
        server.save()
        client.storage.disabledDrops.push(channel.id)

        return message.channel.send(`"${channel}" is now drop ignored.`)

    }
}