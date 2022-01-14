const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')
const database = require('../database/models/submissionSchema')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Check the leaderboard for the event!'),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const rawLb = await database.find({})
        const emo_jis = [
            '<:black1:919554266929197117><:blank:914473340129906708>',
            '<:b2:919554323363557396><:blank:914473340129906708>',
            '<:b3:919559077485486091><:blank:914473340129906708>',
            '<:b4:919559410668425266><:blank:914473340129906708>',
            '<:b5:919554441525493760><:blank:914473340129906708>',
            '<:b6:919554511247388712><:blank:914473340129906708>',
            '<:b7:920240450667950101><:blank:914473340129906708>',
            '<:b8:931434424787148840><:blank:914473340129906708>',
            '<:b9:919554613840076840><:blank:914473340129906708>',
            '<:black1:919554266929197117><:bo:919555310228742144>',
        ]
        const maap = rawLb
            .sort((a, b) => b.votes.netVotes - a.votes.netVotes)
            .slice(0, 10)
            .map(
                (value, index) =>
                    `${emo_jis[index]}. **<@${
                        value.userId
                    }>**'s [submission]() with **${value.votes.netVotes.toLocaleString()}** net votes!\n<:yes:931435927061020712> - <:upvote:931078295435505736> **${value.votes.upvotes.toLocaleString()}** : <:downvote:931078357637038080> **${
                        value.votes.downvotes
                    }**`
            )

        return interaction.reply({
            content: null,
            embeds: [
                {
                    title: 'Leaderboard',
                    color: 'DARK_BUT_NOT_BLACK',
                    description: maap.join('\n\n'),
                    timestamp: new Date(),
                },
            ],
        })
    },
}
