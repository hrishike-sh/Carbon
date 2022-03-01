const prefix = 'fh '
const {
    Message,
    Client,
    MessageEmbed,
    MessageSelectMenu,
    MessageActionRow,
    SelectMenuInteraction,
} = require('discord.js')
module.exports = {
    name: 'help',
    description: 'Help command',
    category: 'Other',
    /**
     * @param {Message} message
     * @param {Client} client
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (args) {
        }
        const embed = new MessageEmbed()
            .setTitle('❓ Help Command')
            .setColor('GREEN')
            .setDescription(`Select a Category to see the commands!`)
            .setThumbnail(client.user.displayAvatarURL())

        const selection = new MessageSelectMenu()
            .setPlaceholder('Choose a Category...')
            .setCustomId('help-menu')
            .setOptions([
                {
                    label: 'Fights',
                    value: 'select-Fights',
                    description: 'All commands related to Fighting!',
                    emoji: '👊',
                },
                {
                    label: 'Donations',
                    value: 'select-Donation',
                    description: 'Donation commands that help your server!',
                    emoji: '💵',
                },
                {
                    label: 'Fun',
                    value: 'select-Fun',
                    description: 'Fun commands to try out!',
                    emoji: '🎈',
                },
                {
                    label: 'Developer',
                    value: 'select-Developer',
                    description:
                        "Chances are, you can't use any of these commands.",
                    emoji: '👩‍💻',
                },
                {
                    label: 'Giveaways',
                    value: 'select-Giveaways',
                    description:
                        'Commands that handle giveaways in your server.',
                    emoji: '🎉',
                },
                {
                    label: 'Utility',
                    value: 'select-Utility',
                    description: 'Commands that might help you.',
                    emoji: '⚙',
                },
                {
                    label: 'Other',
                    value: 'select-Other',
                    description: "Hrish didn't know where these commands go",
                    emoji: '📚',
                },
            ])
            .setMaxValues(1)
            .setMinValues(1)

        const mainMessage = await message.channel.send({
            embeds: [embed],
            components: [new MessageActionRow().addComponents([selection])],
        })

        const mainCollector = mainMessage.createMessageComponentCollector({
            time: 60 * 1000 * 2,
            filter: (u) => u.user.id === message.author.id,
        })

        mainCollector.on('collect', async (select) => {
            const value = select.values[0]
            const category = value.replace('select-', '')
            const commands = {
                legacy: client.c.commands.filter(
                    (c) => c.category && c.category === category
                ),
                slash: client.c.slashCommands.filter(
                    (c) => c.category && c.category === category
                ),
            }

            select.deferUpdate()
            embed.addField(
                'Legacy',
                commands.legacy.map((c) => `\`${c.name}\` `).join(', ') ||
                    'No commands here!',
                false
            )
            embed.addField(
                'Slash Commands',
                commands.slash.map((c) => `\`${c.data.name}\` `).join(', ') ||
                    'No commands here!'
            )
            embed.setFields([
                {
                    name: 'Legacy Commands',
                    value:
                        commands.legacy
                            .map((c) => `\`${c.name}\` `)
                            .join(', ') || 'No commands here!',
                    inline: false,
                },
                {
                    name: 'Slash Commands',
                    value:
                        commands.slash
                            .map((c) => `\`${c.name}\` `)
                            .join(', ') || 'No commands here!',
                    inline: false,
                },
            ])
            select.message.edit({
                embeds: [embed],
                components: [new MessageActionRow().addComponents([selection])],
            })
        })
    },
}
