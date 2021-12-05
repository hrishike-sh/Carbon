const { Client, Message, MessageEmbed } = require('discord.js');
const db = require('../../database/models/settingsSchema')
module.exports = {
    name: 'heist-mode',
    aliases: ['heistmode'],
    fhOnly: false,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {

        let server = await db.findOne({ guildID: message.guild.id })

        if (!server) {
            server = new db({
                guildID: message.guild.id,
                heistMode: {
                    enabled: false,
                    joined: null,
                    left: null
                }
            })
            server.save()
        }

        const { heistMode } = server

        if (!args) {
            const helpBed = new MessageEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setTitle("Heist Mode")
                .setDescription("Set this to enabled before your server's heist and the bot will count how many users joined and left your server during the heist!")
                .addField("fh heistmode on", "Turns on the heist mode in your server. Run this __before__ starting a heist in your server.")
                .addField("fh heistmode off", "Turns off the heist mode in your server. Run this after your heist is over. This also shows the heist stats.")
                .addField("fh heistmode stats", "Shows the heist stats IF heist mode is enabled in the server.")
                .setTimestamp()

            return message.channel.send({ embed: helpBed })
        }


    }
}