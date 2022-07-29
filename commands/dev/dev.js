const { Message, Client, MessageEmbed } = require('discord.js')

module.exports = {
    name: 'dev',
    aliases: ['cringe', 'fuck'],
    description: "Unpaid user's favorite command!!",
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id))
            return message.reply(`This command can only be run by idiots!`)

        const subc = ['stats']
        const wtf = args[0]?.toLowerCase()
        if (!wtf)
            return message.reply(
                `Not a valid sub-command.\nCommands: ${subc.join(', ')}`
            )

        if (wtf == 'stats') {
            const embed = new MessageEmbed()
                .setTitle('Bot Stats')
                .addField(
                    'Up since',
                    `${client.functions.formatTime(client.uptime)}`,
                    true
                )
                .addField(
                    'Cache',
                    `\`\`\`js\nUSERS: ${client.users.cache.size.toLocaleString()}\nGUILDS: ${client.users.cache.size.toLocaleString()}\nCHANNELS: ${client.channels.cache.size.toLocaleString()}\`\`\``
                )
                .setColor('RANDOM')

            await message.reply({
                embeds: [embed],
            })
        }
    },
}
