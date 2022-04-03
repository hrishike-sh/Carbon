const { Collection, Intents, Client, MessageEmbed } = require('discord.js')
const fs = require('fs')
const shell = require('shelljs')
const mongoose = require('mongoose')
const config = require('./config.json')
require('dotenv').config()

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
})

let dbURL = process.env.mongopath
mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
})
client.c = {
    commands: new Collection(),
    cooldowns: new Collection(),
    disabledCommands: [],
    slashCommands: new Collection(),
}
client.snipes = {
    snipes: new Collection(),
    esnipes: new Collection(),
}
client.db = {
    afks: [],
    afkIgnore: [],
    disabledDrops: [],
    fighthub: null,
    reminders: [],
    ars: [],
    messages: new Collection(),
    censors: [],
}
const skripts = require('./scripts')
client.functions = {
    parseAmount: skripts.parseAmount,
    dmUser: skripts.dmUser,
    getRandom: skripts.getRandom,
    sleep: skripts.sleep,
    formatTime: skripts.formatTime,
}
client.switches = {
    commands: true,
    slashCommands: true,
}
client.config = config

client.options.allowedMentions = {
    roles: [],
    parse: ['users'],
}
shell.exec('node deploy.js')
const { cooldowns } = client.c
let commandsRan = 0
const commandFolders = fs.readdirSync('./commands')
const eventFiles = fs
    .readdirSync('./events')
    .filter((file) => file.endsWith('.js'))
for (const folder of commandFolders) {
    const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith('.js'))
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`)
        client.c.commands.set(command.name, command)
    }
}
for (const file of eventFiles) {
    const event = require(`./events/${file}`)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
    } else {
        client.on(event.name, (...args) => event.execute(...args, client))
    }
}
const commandFiles = fs
    .readdirSync('./slashcommands')
    .filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./slashcommands/${file}`)

    client.c.slashCommands.set(command.data.name, command)
}

process.on('uncaughtException', (err) => {
    console.log(err)
})

process.on('unhandledRejection', (err) => {
    console.log(err)
})

client.on('ready', async () => {
    console.log('Logged in.')
    client.emit('tick')
    client.user.setActivity({
        name: 'nya UwU 😼',
        type: 'STREAMING',
    })
    client.db.fighthub = client.guilds.cache.get(config.guildId)
    // LOGS
    const restartEmbed = new MessageEmbed({
        description: `Bot restarted <t:${(new Date() / 1000).toFixed(0)}:R>`,
    })
    client.channels.cache.get(config.logs.restartLog)?.send({
        embeds: [restartEmbed],
    })
    //LOGS
    //AFKS
    const afks = require('./database/models/user')
    const serverIgnores = require('./database/models/settingsSchema')
    let peopleWhoAreAFK = await afks.find({})
    peopleWhoAreAFK = peopleWhoAreAFK.filter((u) => u.afk.afk === true)
    let channelIgnores = await serverIgnores.find({})
    channelIgnores = channelIgnores.filter(
        (s) => s.afkIgnore && s.afkIgnore.length > 0
    )

    for (const channel of channelIgnores) {
        client.db.afkIgnore = [...client.db.afkIgnore, ...channel.afkIgnore]
    }

    for (const afk of peopleWhoAreAFK) {
        client.db.afks.push(afk.userId)
    }
    //AFKS

    client.db.disabledDrops = (
        await serverIgnores.findOne({ guildID: client.db.fighthub.id })
    ).disabledDrop

    // Reminders
    const reminders = require('./database/models/remind')
    client.db.reminders = await reminders.find({})
    // Reminders

    // ARS
    const ars = require('./database/models/ar')
    client.db.ars = await ars.find({})
    // ARS

    // CENSORS
    let cens = require('./database/models/settingsSchema')
    cens = (await cens.findOne({ guildID: client.db.fighthub.id })).censors
        .censors
    client.db.censors = cens
    // CENSORS

    // Disabled Commands
    let dcommands = (await require('./database/models/command').find()).filter(
        (a) => a.disabled
    )
    dcommands.forEach((val) => {
        client.c.disabledCommands.push(val.name)
    })
    // Disabled Commands
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

    const { commandName } = interaction

    const command = client.c.slashCommands.get(commandName)

    if (!command) return
    if (
        !client.switches.slashCommands &&
        !client.config.trustedAccess.includes(interaction.user.id)
    ) {
        return interaction.reply({
            content: 'Slash Commands are disabled temporarily.',
        })
    }
    if (command.permissions) {
        if (!interaction.member.permissions.has(command.permissions)) {
            return interaction.reply({
                content: `You need the \`${command.permissions.toUpperCase()}\` permission to run this command.`,
                ephemeral: true,
            })
        }
    }

    try {
        await command.execute(interaction, client)

        const commandbed = new MessageEmbed()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle(command.data.name)
            .setDescription(`**This was a slash command**`)
            .addField('Total commands ran', commandsRan.toString(), true)
            .addField(
                'Server | Channel',
                `${interaction.guild.name} | ${interaction.channel} (${interaction.channel.name})`
            )
            .setTimestamp()

        await client.channels.cache.get(config.logs.cmdLogging)?.send({
            embeds: [commandbed],
        })
        commandsRan++
    } catch (e) {
        console.error(e)
        await interaction.reply({
            content:
                'There was an error executing this command, the devs are notified',
            ephemeral: true,
        })
    }
})

client.on('messageCreate', async (message) => {
    if (!message.content.toLowerCase().startsWith(config.prefix)) return
    if (message.author.bot) return

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
    const commandName = args.shift().toLowerCase()

    const command =
        client.c.commands.get(commandName) ||
        client.c.commands.find(
            (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        )

    if (!command) return
    if (client.c.disabledCommands.includes(command.name)) {
        return message.reply('This command is temporarily disabled.')
    }
    if (message.guild && message.guild.id !== config.guildId && command.fhOnly)
        return message.reply(
            `This command can only be run in FightHub temporarily.`
        )

    if (
        command.disabledChannels &&
        command.disabledChannels.includes(message.channel.id)
    ) {
        message.react('❌')
        return
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Collection())
    }

    const now = Date.now()
    const timestamps = cooldowns.get(command.name)
    const cooldownAmount = (command.cooldown || 0) * 1000

    if (timestamps.has(message.author.id)) {
        const expirationTime =
            timestamps.get(message.author.id) + cooldownAmount

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000
            return message.reply({
                embed: new MessageEmbed()
                    .setDescription(
                        `:x: You have to wait for **${Math.ceil(
                            timeLeft
                        )} seconds** before running this command again!`
                    )
                    .setColor('RED'),
            })
        }
    }

    timestamps.set(message.author.id, now)
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)
    if (command.args && !args.length) {
        let reply = 'You did not provide any arguments!'

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``
        }
        return message.reply({
            content: reply,
        })
    }
    try {
        command.execute(message, args, client)
        commandsRan++
        const commandbed = new MessageEmbed()
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTitle(command.name)
            .setDescription(`**Message:** \`${message.content}\``)
            .addField('Total commands ran', commandsRan.toString(), true)
            .addField(
                'Server | Channel',
                `${message.guild.name} | ${message.channel} (${message.channel.name})`
            )
            .setTimestamp()

        await client.channels.cache.get(config.logs.cmdLogging)?.send({
            embeds: [commandbed],
        })
    } catch (error) {
        console.log(error)
        message.reply('An error occured while running this command.')
    }
})
client.on('error', (error) => {
    console.log(error)
})
client.login(process.env.token)
