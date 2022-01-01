const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { clientId, guildId } = require('./config.json')

const commands = []
const commandFiles = fs
    .readdirSync('./slashcommands')
    .filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./slashcommands/${file}`)
    commands.push(command.data.toJSON())
}

const rest = new REST({ version: '9' }).setToken(process.env.token)

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Registered slash commands.'))
    .catch(console.error)
