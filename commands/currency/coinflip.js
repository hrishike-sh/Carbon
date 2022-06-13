const { addCoins, removeCoins, getUser } = require('../../functions/currency')
const { Message, Client } = require('discord.js')
module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    usage: '<h/t><amount>',
    args: true,
    cooldown: 15,
    description: 'Gamble all your coins away.',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const what = args[0]
        const array = ['h', 't']
        if (!array.includes(what.toLowerCase())) {
            return message.reply(
                `That is not how you coinflip. This is how you do it: fh cf h 2000`
            )
        }

        args.shift()
        let amount = args[0]
        amount = client.functions.parseAmount(amount)
        if (!amount)
            return message.reply(`Could not parse ${args[0]} as valid amount.`)

        const { Balance } = await getUser(message.author.id)
        if (Balance < amount) {
            return message.reply(
                "You don't even have " + amount.toLocaleString() + ' coins'
            )
        }

        if (amount > 5e6)
            return message.reply(
                'You cannot gamble more than 5 million at once.'
            )

        const random = array[Math.floor(Math.random() * 2)]
        if (random === what) {
            const coins = await addCoins(message.author.id, amount)
            return message.reply(
                `**You won ${amount.toLocaleString()}!!!**\nYou now have ${coins.toLocaleString()} coins.`
            )
        } else {
            const coins = await removeCoins(message.author.id, amount)
            return message.reply(
                `**You lost ${amount.toLocaleString()}. L**\nYou now have ${coins.toLocaleString()} coins.`
            )
        }
    },
}
