const { Message, Client } = require('discord.js')
const fs = require('fs')
module.exports = {
    name: 'reload',
    usage: '<command>',
    description: 'Reloads a command.',
    category: 'Developer',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id)) return

        let command = args[0]?.toString()
        if (!command) return message.reply('Please provide command name.')

        if (
            !client.c.commands.has(command) &&
            !client.c.commands.find(
                (a) => a.aliases && a.aliases.includes(command)
            )
        )
            return message.reply(`No command \`${command}\` found.`)

        command =
            client.c.commands.get(command) ||
            client.c.commands.find((a) => a.aliases.includes(command))

        const folders = fs.readdirSync('./commands')
        const fName = folders.find((f) =>
            fs.readdirSync(`./commands/$${f}`).includes(`${command.name}.js`)
        )

        //delete command from cache

        delete require.cache[
            require.resolve(`./commands/${fName}/${command.name}.js`)
        ]

        //set new command

        try {
            const newCommand = require(`./commands/${fName}/${command.name}.js`)
            client.c.commands.set(newCommand.name, newCommand)

            message.channel.send(`Command ${command.name} has been reloaded.`)
        } catch (e) {
            message.reply(
                `Couldn't reload command!\nError:\n\`\`\`js\n${e.message}\n\`\`\``
            )
        }
    },
}
