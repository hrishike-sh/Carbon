const { Client, Message, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'snipeset',
    fhOnly: false,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {

        return message.channel.send("This command is still under development.")

        const admin = message.member.permissions.has("ADMINISTRATOR")

        if (!admin) {
            message.channel.send(`You must have the \`ADMINISTRATOR\` permission to run this command.`)
        }

        if (!args[0]) {
            message.channel.send(`Please specify what you want to do.\nType \`fh snipeset help\` for more info.`)
            return;
        }

    }
}