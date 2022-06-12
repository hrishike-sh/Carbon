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
    async execute(message, args) {
        let target = args[0]
        if (target) {
            if (message.content.includes('@')) {
                target = message.mentions.members?.first()
            } else {
                try {
                    target = await message.guild.members.fetch({
                        user: args[0],
                    })
                } catch (e) {
                    target = false
                }
            }
        }

        if (message.channel.id === '834394537249996810') {
            return message.channel.send('Blacklisted users can\'t use this command')
        }

        if (!target) target = message.member

        const user = await getUser(target.id)
        message.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle(`${target.displayName}'s balance`)
                    .setDescription(
                        `**Balance:** ${user.Balance.toLocaleString()} coins`
                    ),
            ],
        })
    },
}
