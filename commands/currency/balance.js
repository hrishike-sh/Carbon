const { Message, MessageEmbed } = require('discord.js')
const { getUser } = require('../../functions/currency')
module.exports = {
    name: 'balance',
    aliases: ['bal'],
    cooldown: 1,
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {},
}
