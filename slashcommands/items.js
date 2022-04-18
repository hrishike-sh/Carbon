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
        .setDescription('Check all the available items that you can donate!')
        .addStringOption((opt) => {
            return opt
                .setName('query')
                .setRequired(false)
                .setDescription(
                    'An optional query to search items. (Search Item Ids)'
                )
        }),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        let items = await db.find({})
        if (interaction.options.getString('query')) {
            items = items.filter((a) =>
                a.item_id
                    .toLowerCase()
                    .includes(
                        interaction.options
                            .getString('query')
                            .toLocaleLowerCase()
                    )
            )
            if (!items.length) {
                return interaction.reply('No search results found.')
            }
        }
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
            .setFooter({
                text: `Page 1/${Items.length}`,
            })

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

        const collector = mainMessage.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== interaction.user.id) {
                    return b.reply({
                        content: 'Not for you.',
                        ephemeral: true,
                    })
                } else return true
            },
            time: 600000,
        })
        let index = 0
        collector.on('collect', async (b) => {
            b.deferUpdate()
            const todo = b.customId.replace('-items', '')

            if (todo == 'first') {
                index = 0
            } else if (todo == 'prev') {
                index--
                index < 0 ? (index = 0) : null
            } else if (todo == 'next') {
                index++
                index > Items.length - 1 ? (index = Items.length - 1) : null
            } else {
                index = Items.length - 1
            }

            embed.setDescription(Items[index].join('\n\n'))
            embed.setFooter({
                text: `${index + 1}/${Items.length}`,
            })
            mainMessage.edit({
                embeds: [embed],
            })
        })
    },
}
