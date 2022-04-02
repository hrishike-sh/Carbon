const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
} = require('discord.js')
const DBCommands = require('../../database/models/command')
module.exports = {
    name: 'switchboard',
    aliases: ['sb'],
    description: "You don't need to know.",
    /**
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const switches = client.switches

        if (!client.config.trustedAccess.includes(message.author.id)) return
        const allDbCommands = await DBCommands.find({})
        const embed = new MessageEmbed()
            .setTitle('SwitchBoard')
            .setColor('NAVY')
            .setTimestamp()
            .setDescription(
                'Use the buttons to toggle the switches.\nIf the button is green, the switch is turned on, which means it WILL work.'
            )
            .addField(
                'Legacy Commands',
                "Regular bot commands like `fh snipe` won't work if this is disabled.",
                true
            )
            .addField(
                'Slash Commands',
                "Slash Commands won't work if this is disabled. Example: `/wordle`",
                true
            )
        const components = new MessageActionRow().addComponents([
            new MessageButton()
                .setLabel(`Commands`)
                .setStyle(switches.commands ? 'SUCCESS' : 'DANGER')
                .setCustomId('commands-switch'),
            new MessageButton()
                .setLabel(`Slash Commands`)
                .setStyle(switches.slashCommands ? 'SUCCESS' : 'DANGER')
                .setCustomId('scommands-switch'),
        ])

        const mainMessage = await message.channel.send({
            embeds: [embed],
            components: [components],
        })
        const collector = mainMessage.createMessageComponentCollector({
            filter: (button) => {
                if (button.user.id !== message.author.id) {
                    return button.reply({
                        content: 'Not for you.',
                        ephemeral: true,
                    })
                } else return true
            },
            time: 30 * 1000,
        })

        collector.on('collect', async (button) => {
            if (message.author.id !== button.user.id)
                return button.reply({
                    content: "something's wrong",
                    ephemeral: true,
                })

            const ID = button.customId.replace('-switch', '')

            if (ID === 'commands') {
                const selection = new MessageSelectMenu()
                    .setCustomId('select-commands-switch')
                    .setPlaceholder('Choose a specific command.')
                    .setMaxValues(1)
                    .setMinValues(1)

                for (const [key, value] of client.c.commands) {
                    selection.addOptions([
                        {
                            label: value.name || 'ERROR',
                            value: `command:${
                                value.name || 'hrishissodumb'
                            }-switch`,
                            emoji:
                                (allDbCommands.find((a) => a.name == value.name)
                                    ?.disabled
                                    ? '❌'
                                    : '✅') || '❔',
                        },
                    ])
                }
                const newCollector = (
                    await mainMessage.edit({
                        components: [
                            new MessageActionRow().addComponents([selection]),
                        ],
                    })
                ).createMessageComponentCollector({
                    filter: (button) => {
                        if (button.user.id !== message.author.id) {
                            return button.reply({
                                content: 'Not for you.',
                                ephemeral: true,
                            })
                        } else return true
                    },
                })

                newCollector.on('collect', async (select) => {})
            } else if (ID === 'scommands') {
            } else return
        })
    },
}
