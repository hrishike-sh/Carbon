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
        const { commands } = client

        if (!args.length) {
            const commandsMap = commands
                .map((command) => `\`${command.name}\``)
                .join(', ')

            message.react('📨')
            return message.author.send(
                new MessageEmbed()
                    .setTitle('Help Command')
                    .setDescription(commandsMap)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setColor('GREEN')
                    .setFooter(
                        'Type fh help [command name] for further info about the command.'
                    )
            )
        }

        const name = args[0].toLowerCase()
        const command =
            commands.get(name) ||
            commands.find((c) => c.aliases && c.aliases.includes(name))

        if (!command) {
            return message.reply("that's not a valid command!")
        }

        data.push(`**Name:** ${command.name}`)

        if (command.aliases)
            data.push(`**Aliases:** ${command.aliases.join(', ')}`)
        if (command.description)
            data.push(`**Description:** ${command.description}`)
        if (command.usage)
            data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`)

        data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`)

        message.channel.send(data, {
            split: true,
        })
    },
}
