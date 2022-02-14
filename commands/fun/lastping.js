const { Message, MessageEmbed } = require('discord.js')
const Pings = require('../../database/models/ping')
module.exports = {
    name: 'lastping',
    aliases: ['lp'],
    usage: '',
    description: 'Check your previous 10 pings in the server!',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        if (
            !message.member.roles.cache.hasAny([
                '826197829126979635',
                '824687526396297226',
                '825965323500126208',
                '828048225096826890',
            ])
        ) {
            message.reply(
                `You don't have permission to run this command. Check <#843943148945276949> for more info.`
            )
        }

        const DBUser = await Pings.findOne({ userId: message.author.id })

        const PingBed = new MessageEmbed()
            .setTitle('Last Pings')
            .setColor('GREEN')
            .setTimestamp()

        if (!DBUser || !DBUser?.pings.length) {
            PingBed.setDescription(`None of your pings have been counted yet!`)
            return message.reply({
                embeds: [PingBed],
            })
        }

        const pings = DBUser.pings
        const map = pings
            .map(
                (V, I) =>
                    `${I + 1}. **In <#${V.channel}> <t:${(
                        (new Date().getTime() - V.when) /
                        1000
                    ).toFixed(0)}:R>**\n**${V.author.tag}**: ${
                        V.content
                    } [[Jump]](${V.message_link})`
            )
            .join('\n➖➖➖➖➖➖➖\n')
        PingBed.setDescription(map)
        message.reply({
            embeds: [PingBed],
        })
    },
}
