const { Message } = require('discord.js')

module.exports = {
    name: 'highlight',
    aliases: ['hl'],
    usage: '<add/remove/list> <highlight>',
    description: "Carl bot's highlight feature.",
    subcommands: ['add', 'remove', 'list', '+', '-'],
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {},
}
