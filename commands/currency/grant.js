const { addCoins, getUser, removeCoins } = require('../../functions/currency')
const { Message } = require('discord.js')
module.exports = {
    name: 'grant',
    aliases: ['hrish'],
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        if (message.author.id !== '598918643727990784') return

        const what = args[0]
        args.shift()
        if (what == 'set') {
            const user = args[0]
            const value = args[1]
            const { Balance } = await getUser(user)
            await removeCoins(user, Balance)
            await addCoins(user, value)

            return message.reply('k')
        } else if (what === 'wipe') {
            const user = args[0]
            const value = args[1]
            const { Balance } = await getUser(user)
            await removeCoins(user, Balance)

            return message.reply('k')
        } else if (what == 'r') {
            const user = args[0]
            const value = args[1]
            await removeCoins(user, value)

            return message.reply('k')
        } else if (what == 'd') {
            const user = args[0]
            const value = args[1]
            await addCoins(user, value)

            message.reply('k')
        }
    },
}
