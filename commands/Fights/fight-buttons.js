const { Message, Client, Collection, MessageEmbed } = require('discord.js')
const fighting = new Collection()

const KITS = new Collection({
    SWORDSMAN: {
        ATK: 20,
        HP: 50,
        DFS: 5,
        RGN: 2,
    },
    FIGHTER: {
        ATK: 15,
        HP: 75,
        DFS: 2,
        RGN: 2,
    },
    TANK: {
        ATK: 5,
        HP: 50,
        DFS: 10,
        RGN: 10,
    },
})

module.exports = {
    name: 'fight',
    usage: `<@USER>`,
    description: 'Battle a user!',
    category: 'Fights',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const target = message.mentions.users?.first() || null
        if (!target || target.id == message.author.id) {
            return message.reply(`You have to ping someone else to fight!`)
        }

        const kitEmbed = new MessageEmbed()
            .setTitle('Select a __kit__!')
            .setDescription(`Please select a kit to proceed.`)

        for (const [key, value] of KITS) {
        }
    },
}
