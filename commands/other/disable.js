
const db = require('../../database/models/settingsSchema')

module.exports = {
    name: 'disable',
    async execute(message, args, client) {
        let server = await db.findOne({ guildID: message.guild.id })

        if (!server) {
            server = new db({
                guildID: message.guild.id,
                disabled: {}
            }).save()
        }

        if (!args[0]) return message.channel.send(`Please provide a valid command name.`)

        const commandName = args[0].toLowerCase()
        const command = client.commands.get(commandName)

        if (!command) return message.channel.send(`No such command with name ${command} was found...`)

        args.shift()

        if (!args[0]) return message.channel.send(`Please tag a channel or give its id.`)

        let channel = message.mentions.channels.first().id || args[0]

        channel = message.guild.channels.cache.get(channel) || null

        if (!channel) {
            return message.channel.send(`Could not find any channel with that id!`)
        }

        client.disabledCommands.set(message.channel.id, [...client.disabledCommands.get(message.channel.id), command])

        return message.channel.send(`The command should now be disabled (temporarily).`)


    }
}