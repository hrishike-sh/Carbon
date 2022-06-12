const { Client, Message, MessageEmbed } = require('discord.js')
const { addCoins } = require('../../functions/currency')

module.exports = {
    name: 'beg',
    fhOnly: true,
    cooldown: 15,
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        const MESSAGES = [
            'Hrish has not added any cool comments here. In compensation you receive {{coins}} coins.',
            "You stole one of Tee's shoes and sell it for {{coins}} coins!",
            'You find Fellintron crying in a corner. He gives you {{coins}} coins to leave him alone!',
            "While going through Sunny's E-Girl PFP collection you manage to find a NFT! You sell it for {{coins}} coins",
            "You get access to Hrish's database and give yourself {{coins}} coins!",
            "You go through mirror's DMs and you find a lot of Nitro Gifts!! You RMT them for {{coins}} coins. SIMPS!!",
            "You kill all the spiders in Stacey's australian house and you're awarded with {{coins}} coins!!",
            'Deep gave you {{coins}} coins for not calling him peeD!',
        ]
        const randomComment =
            MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

        const randomAmount = Math.floor(Math.random() * 10000) + 5000
        const added = await addCoins(message.author.id, randomAmount)
        message.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle('The bot devs are lazy')
                    .setColor('RANDOM')
                    .setDescription(
                        randomComment.replace(
                            '{{coins}}',
                            randomAmount.toLocaleString()
                        )
                    )
                    .setFooter({
                        iconURL: message.author.displayAvatarURL(),
                        text: `You now have a total of ${added.toLocaleString()} coins!`,
                    }),
            ],
        })
    },
}
