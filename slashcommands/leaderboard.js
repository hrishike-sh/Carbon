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

        const maap = rawLb
            .sort((a, b) => b.votes.netVotes - a.votes.netVotes)
            .slice(0, 10)
            .map(
                (value, index) =>
                    `<:yes:931435927061020712> **<@${
                        value.userId
                    }>**'s [submission]() with **${value.votes.netVotes.toLocaleString()}** net votes!\n<:dot:931436867272998922> - <:upvote:931078295435505736> **${value.votes.upvotes.toLocaleString()}** : <:downvote:931078357637038080> **${
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
