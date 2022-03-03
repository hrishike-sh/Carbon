const { Message } = require('discord.js')

module.exports = {
    name: 'choose',
    category: 'Utility',
    usage: '<options>',
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        if (message.content.includes(',')) {
            const argarray = args.join(' ').split(',')
            return message.reply(
                `I choose ${
                    argarray[Math.floor(Math.random() * argarray.length)]
                }`
            )
        } else
            return message.reply({
                content: `I choose ${
                    args[Math.floor(Math.random() * args.length)]
                }`,
            })
    },
}
