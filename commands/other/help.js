const prefix = 'fh '
const { Message, Client, MessageEmbed } = require('discord.js')
module.exports = {
    name: 'help',
    description: 'Please send help',
    /**
     * @param {Message} message
     * @param {Client} client
     * @param {String[]} args
     */
    async execute(message, args, client) {
        /**commands.map(command => command.name).join(', ') */
        const data = []
        const { commands } = client.c

        if (!args.length) {
            const commandsMap = commands
                .map((command) => `\`${command.name}\``)
                .join(', ')

            message.react('📨')
            return message.author.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Help Command')
                        .setDescription(commandsMap)
                        .setThumbnail(client.user.displayAvatarURL())
                        .setColor('GREEN')
                        .setFooter(
                            'Type fh help [command name] for further info about the command.'
                        ),
                ],
            })
        }

        const name = args[0].toLowerCase()
        const command =
            commands.get(name) ||
            commands.find((c) => c.aliases && c.aliases.includes(name))

        if (!command) {
            return message.reply("that's not a valid command!")
        }

        const extendedCommandEmbed = new MessageEmbed()
            .setTitle(command.name)
            .setDescription('')
            .setFooter('Syntax: <required> [optional]')

        if (command.aliases)
            extendedCommandEmbed.addField(
                'Aliases',
                command.aliases.join(', '),
                false
            )
        if (command.description)
            extendedCommandEmbed.setDescription(command.description)
        if (command.usage)
            extendedCommandEmbed.addField(
                'Usage',
                `\`\`\`xml\n<Usage : ${prefix}${command.name} ${command.usage}>\n\`\`\``,
                false
            )

        extendedCommandEmbed.addField(
            'Cooldown',
            `${command.cooldown || 2} seconds.`,
            false
        )

        message.channel.send({
            split: true,
            embeds: [extendedCommandEmbed],
        })
    },
}
