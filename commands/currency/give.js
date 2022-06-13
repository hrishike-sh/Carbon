const { addCoins, removeCoins, getUser } = require('../../functions/currency')
const { Message, Client } = require('discord.js')
module.exports = {
    name: 'give',
    aliases: ['slide', 'share'],
    description: 'Give some coins to other users.',
    usage: '<amount> <user>',
    args: true,
    cooldown: 10,
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const { Balance } = await getUser(message.author.id)
        let amount = args[0]
        if (amount > Balance) {
            return message.reply(
                `You have ${Balance.toLocaleString()} coins. You cannot share ${amount.toLocaleString()} coins??!`
            )
        }
        amount = client.functions.parseAmount(amount)
        if (!amount)
            return message.reply(`Could not parse ${args[0]} as valid amount!`)

        args.shift()
        let target = message.mentions.users?.first()
        if(target.id === message.author.id) return message.reply("You cannot share coins with yourself.")
        if (!target) return message.reply(`You must ping the user!`)

        const author = await removeCoins(message.author.id, amount)
        const targetCoins = await addCoins(target.id, amount)

        return message.reply({
            embeds: [
                {
                    title: 'Transferred',
                    description: `You sent ${target.toString()} **${amount.toLocaleString()}** coins.`,
                    color: 'GREEN',
                },
            ],
        }) // .
    },
}
