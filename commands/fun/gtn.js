import { Message } from 'discord.js'

module.exports = {
    name: 'gtn',
    usage: '[max limit]',
    args: true,
    description: 'Start a game of guess the number as an event.',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {},
}
