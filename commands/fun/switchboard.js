const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')

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

        const msg = await message.channel.send({
            embeds: [embed],
            components: [...components],
        })
        const collector = msg.createMessageComponentCollector({
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
            switch (ID) {
                case 'commands':
                    client.switches.commands = client.switches.commands
                        ? false
                        : true
                    msg.components[0].components
                        .find((b) => b.customId === 'commands-switch')
                        .setStyle(
                            client.switches.commands ? 'SUCCESS' : 'DANGER'
                        )
                    msg.edit({
                        components: [...msg.components],
                    })
                    button.reply({
                        content: `Commands are now ${
                            client.switches.commands ? 'ENABLED' : 'DISABLED'
                        } globally.`,
                    })
                case 'scommands':
                    client.switches.slashCommands = client.switches
                        .slashCommands
                        ? false
                        : true
                    msg.components[0].components
                        .find((b) => b.customId === 'scommands-switch')
                        .setStyle(
                            client.switches.slashCommands ? 'SUCCESS' : 'DANGER'
                        )
                    msg.edit({
                        components: [...msg.components],
                    })
                    button.reply({
                        content: `Slash Commands are now ${
                            client.switches.slashCommands
                                ? 'ENABLED'
                                : 'DISABLED'
                        } globally.`,
                    })
            }
        })
    },
}
