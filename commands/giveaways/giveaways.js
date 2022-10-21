const { Message, Formatters, EmbedBuilder } = require('discord.js')
const Database = require('../../database/models/giveaway')
module.exports = {
    name: 'giveaways',
    category: 'Giveaways',
    fhOnly: true,
    /**
     *
     * @param {Message} message
     */
    async execute(message) {
        const giveaways = await Database.find({ hasEnded: false })
        const emo_jis = [
            '<:blank:914473340129906708><:black1:919554266929197117>',
            '<:blank:914473340129906708><:b2:919554323363557396>',
            '<:blank:914473340129906708><:b3:919559077485486091>',
            '<:blank:914473340129906708><:b4:919559410668425266>',
            '<:blank:914473340129906708><:b5:919554441525493760>',
            '<:blank:914473340129906708><:b6:919554511247388712>',
            '<:blank:914473340129906708><:b7:920240450667950101>',
            '<:blank:914473340129906708><:b8:931434424787148840>',
            '<:blank:914473340129906708><:b9:919554613840076840>',
            '<:black1:919554266929197117><:bo:919555310228742144>',
        ]
        const map = giveaways
            .sort((a, b) => a.endsAt - b.endsAt)
            .map(
                (g, i) =>
                    `${emo_jis[i]} Prize: **${
                        g.prize
                    }**\n<:blank:914473340129906708><:blank:914473340129906708>Time: ${message.client.functions.formatTime(
                        g.endsAt,
                        'R'
                    )}\n<:blank:914473340129906708><:blank:914473340129906708>Giveaway link: [Jump](https://discord.com/channels/${
                        message.guild.id
                    }/${g.channelId}/${g.messageId})`
            )

        const embed = new EmbedBuilder()
            .setTitle('Freeloader Machine')
            .setDescription(map.join('\n\n') || 'No active giveaways...')
            .setColor('DarkAqua')
            .setTimestamp()
            .setFooter({
                text: '10 latest giveaways are shown.',
            })

        return message.reply({ embeds: [embed] })
    },
}
