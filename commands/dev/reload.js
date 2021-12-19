const fs = require('fs')

module.exports = {
    name: 'reload',
    description: 'reloads a command',
    async execute(message, args) {
        const commandName = args[0].toLowerCase()
        const command =
            message.client.c.commands.get(commandName) ||
            message.client.c.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
            )

        if (!command) {
            return message.channel.send('No such command was found.')
        }

        const commandFolders = fs.readdirSync('./commands')
        const folderName = commandFolders.find((folder) =>
            fs.readdirSync(`./commands/${folder}`).includes(`${commandName}.js`)
        )

        delete require.cache[
            require.resolve(`../${folderName}/${command.name}.js`)
        ]

        try {
            const newCommand = require(`../${folderName}/${command.name}.js`)
            message.client.c.commands.set(newCommand.name, newCommand)
            message.channel.send(`Command \`${newCommand.name}\` was reloaded!`)
        } catch (error) {
            console.error(error)
            message.channel.send(`There was an error.`)
        }
    },
}
