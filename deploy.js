const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { clientId, guildId } = require('./config.json')

const commands = []
const globalCommands = []
const commandFiles = fs
    .readdirSync('./slashcommands')
    .filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./slashcommands/${file}`)
    if (command.global) {
        globalCommands.push(command.data.toJSON())
    } else {
        commands.push(command.data.toJSON())
    }
}

const rest = new REST({ version: '9' }).setToken(process.env.token)

;(async () => {
    try {
        console.log('[FightHub] Started refreshing application (/) commands.')

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        })

        console.log(
            '[FightHub] Successfully reloaded application (/) commands.'
        )
    } catch (error) {
        console.error(error)
    }
})()
;(async () => {
    try {
        console.log('[GLOBAL]: Started refreshing application (/) commands.')

        await rest.put(Routes.applicationGuildCommands(clientId), {
            body: globalCommands,
        })

        console.log('[GLOBAL]: Successfully reloaded application (/) commands.')
    } catch (error) {
        console.error(error)
    }
})()
