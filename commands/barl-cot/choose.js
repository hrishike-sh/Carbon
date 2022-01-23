const { Client, Message, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'choose',
    usage: '<options>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        return message.reply({
            content: `I choose ${
                args[Math.floor(Math.random() * args.length)] ||
                'Nothing out of nothing!'
            }`,
            allowedMentions: {
                roles: [],
                repliedUser: true,
            },
        })
    },
}
