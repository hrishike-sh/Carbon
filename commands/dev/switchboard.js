const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    SelectMenuInteraction,
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
            if (button.isButton()) button.deferUpdate()
            if (ID === 'commands') {
                const selection = new MessageSelectMenu()
                    .setCustomId('select-commands-switch')
                    .setPlaceholder('Choose a specific command.')
                    .setMaxValues(1)
                    .setMinValues(1)
                const selection2 = new MessageSelectMenu()
                    .setCustomId('select-commands2-switch')
                    .setPlaceholder('Other commands...')
                    .setMaxValues(1)
                    .setMinValues(1)
                const selection3 = new MessageSelectMenu()
                    .setCustomId('select-commands3-switch')
                    .setPlaceholder('Other commands...')
                    .setMaxValues(1)
                    .setMinValues(1)
                for (const [key, value] of client.c.commands) {
                    if (selection.options.length > 24) {
                        if (selection2.options.length > 24) {
                            selection3.addOptions([
                                {
                                    label: value.name || 'ERROR',
                                    value: `command:${
                                        value.name || 'hrishissodumb'
                                    }`,
                                    emoji:
                                        (allDbCommands.find(
                                            (a) => a.name == value.name
                                        )?.disabled
                                            ? '❌'
                                            : '✅') || '❔',
                                },
                            ])
                        } else {
                            selection2.addOptions([
                                {
                                    label: value.name || 'ERROR',
                                    value: `command:${
                                        value.name || 'hrishissodumb'
                                    }`,
                                    emoji:
                                        (allDbCommands.find(
                                            (a) => a.name == value.name
                                        )?.disabled
                                            ? '❌'
                                            : '✅') || '❔',
                                },
                            ])
                        }
                    } else {
                        selection.addOptions([
                            {
                                label: value.name || 'ERROR',
                                value: `command:${
                                    value.name || 'hrishissodumb'
                                }`,
                                emoji:
                                    (allDbCommands.find(
                                        (a) => a.name == value.name
                                    )?.disabled
                                        ? '❌'
                                        : '✅') || '❔',
                            },
                        ])
                    }
                }
                const newCollector = (
                    await mainMessage.edit({
                        components: [
                            new MessageActionRow().addComponents([selection]),
                            new MessageActionRow().addComponents([selection2]),
                            new MessageActionRow().addComponents([selection3]),
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
                /**
                 * @param {SelectMenuInteraction} select
                 */
                newCollector.on('collect', async (select) => {
                    const command = select.values[0].split(':')[1]
                    const c = await DBCommands.findOne({
                        name: command,
                    })
                    if (c.disabled) {
                        c.disabled = false
                        client.c.disabledCommands.filter(
                            (a) => a.name !== c.name
                        )
                        c.save()
                        return select.reply(
                            `The \`${c.name}\` command is enabled globally.`
                        )
                    } else {
                        c.disabled = true
                        client.c.disabledCommands.push(c.name)
                        c.save()
                        return select.reply(
                            `The \`${c.name}\` command is disabled globally.`
                        )
                    }
                })
            } else if (ID === 'scommands') {
                button.reply({
                    content: 'This part doesnt work yet',
                    ephemeral: true,
                })
            } else return
        })
    },
}

// hrish pls stop breaking the bot
