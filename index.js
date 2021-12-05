const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
})
require('discord-buttons')(client);
const giveawayModel = require('./database/models/giveaway')
const { DiscordTogether } = require('discord-together')
client.discordTogether = new DiscordTogether(client)
// const http = require('http')
// http.createServer((_, res) => res.end("Hi")).listen(8080)
const fs = require('fs')
const prefix = 'fh '
require('dotenv').config()
const mongoose = require('mongoose')
const { MessageButton, MessageActionRow } = require('discord-buttons')
let dbURL = process.env.mongopath
mongoose.connect(dbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
client.commands = new Discord.Collection()
client.cooldowns = new Discord.Collection()
client.snipes = new Discord.Collection()
client.esnipes = new Discord.Collection()
client.disabledCommands = new Discord.Collection()
client.dropCD = []
client.afks = []
client.afkIgnore = []
client.options.allowedMentions = {
  roles: [],
  parse: ['users']
}
client.storage = {
  fighthub: null,
  disabledDrops: null
}

const {
  cooldowns
} = client;
let commandsRan = 0;
const commandFolders = fs.readdirSync('./commands');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client))
  } else {
    client.on(event.name, (...args) => event.execute(...args, client))
  }
}

process.on('uncaughtException', (err) => {
  console.log(err)
  client.channels.cache.get('912715570070294599').send({
    embed: {
      title: 'The bot almost crashed. (uncaughtException)',
      description: err.message || 'No message data, Check the console'
    },
    content: '<@598918643727990784>'
  })
})

process.on('unhandledRejection', (err) => {
  console.log(err)
  client.channels.cache.get('912715570070294599').send({
    embed: {
      title: 'The bot almost crashed. (unhandledRejection)',
      description: err.message || 'No message data, Check the console'
    },
    content: '<@598918643727990784>'
  })
})


client.on('ready', async () => {
  console.log("Logged in.")
  client.emit('tick')

  client.storage.fighthub = client.guilds.cache.get("824294231447044197")
  // LOGS
  client.channels.cache.get("901739465406566400").send({
    embed: {
      description: `Bot restarted <t:${(new Date() / 1000).toFixed(0)}:R>`
    }
  })
  //LOGS
  //AFKS
  const afks = require('./database/models/user')
  const serverIgnores = require('./database/models/settingsSchema')
  let peopleWhoAreAFK = await afks.find({})
  peopleWhoAreAFK = peopleWhoAreAFK.filter(u => u.afk.afk === true)
  let channelIgnores = await serverIgnores.find({})
  channelIgnores = channelIgnores.filter(s => s.afkIgnore && s.afkIgnore.length > 0)

  for (const channel of channelIgnores) {
    client.afkIgnore = [...client.afkIgnore, ...channel.afkIgnore]
  }

  for (const afk of peopleWhoAreAFK) {
    client.afks.push(afk.userId)
  }
  //AFKS

  client.storage.disabledDrops = (await serverIgnores.findOne({ guildID: client.storage.fighthub.id })).disabledDrop

})


client.on('message', async message => {
  if (!message.content.toLowerCase().startsWith(prefix)) return;
  if (message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

  if (!command) return;
  if (message.guild && message.guild.id !== '824294231447044197' && command.fhOnly) return message.channel.send(`This command can only be run in FightHub.`)

  if (command.disabledChannels && command.disabledChannels.includes(message.channel.id)) { //
    message.react('❌')
    return;
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name)
  const cooldownAmount = (command.cooldown || 2) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply({
        content: `You have to wait for ${timeLeft.toFixed(1)} more second(s) before executing the ${command.name} command.`
      })
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  if (command.args && !args.length) {
    let reply = 'You did not provide any arguments!'

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``
    }
    return message.reply({
      content: reply
    })
  }
  try {
    command.execute(message, args, client)
    commandsRan++;
    (await client.fetchWebhook('913360972842930176')).send(
      new Discord.MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setTitle(command.name)
        .setDescription(`**Message:** \`${message.content}\``)
        .addField("Total commands ran", commandsRan, true)
        .addField("Server | Channel", `${message.guild.name} | ${message.channel}(${message.channel.name})`)
        .setTimestamp()
    )
  } catch (error) {
    console.log(error)
    message.reply("An error occured while running this command.")
  }
})
client.on("error", (error) => {
  console.log(error)
})
client.login(process.env.token)