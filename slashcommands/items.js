const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')
const db = require('../database/models/itemSchema')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('items')
        .setDescription('Check all the available items that you can donate!'),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const items = await db.find({})

        let rawItems = items
            .filter((b, a) => b.value - a.value)
            .map(
                (yes) =>
                    `・**${
                        yes.display.name
                    }** - ⏣ ${yes.value.toLocaleString()}\n*ID*: \`${yes.id}\``
            )

        await interaction.reply({
            embeds: [
                {
                    title: 'Items and Item Values',
                    color: 'GREEN',
                    description: rawItems.join('\n\n'),
                    footer: {
                        text: 'More items to be added yet.',
                    },
                },
            ],
        })
    },
}
