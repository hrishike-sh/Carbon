const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const db = require('../database/models/itemSchema')

module.exports = {
    category: 'Donation',
    data: new SlashCommandBuilder()
        .setName('items')
        .setDescription('Check all the available items that you can donate!'),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const items = await db.find({})

        let rawItems = items.map(
            (yes) =>
                `・**${
                    yes.display.name
                }** - ⏣ ${yes.value.toLocaleString()}\n*ID*: \`${yes.item_id}\``
        )
        const Items = []
        let i
        for (i = 0; i < rawItems.length; i += 10) {
            Items.push(rawItems.slice(i, i + 10))
        }

        await interaction.reply({
            content: 'Use the buttons to navigate.',
            ephemeral: true,
        })
        const embed = new MessageEmbed()
            .setTitle('Dank Memer Items')
            .setColor('AQUA')
            .setDescription(Items[0].join(`\n\n`))

        const mainMessage = await interaction.channel.send({
            embeds: [embed],
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton()
                        .setEmoji('⏪')
                        .setCustomId('first-items')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setEmoji('◀️')
                        .setCustomId('prev-items')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setEmoji('▶️')
                        .setCustomId('next-items')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setEmoji('⏩')
                        .setCustomId('last-items')
                        .setStyle('SECONDARY'),
                ]),
            ],
        })
    },
}
