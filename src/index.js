// define everything
const {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  Message,
  Partials
} = require('discord.js');
const fs = require('fs');
const path = require('node:path');
const { prefix } = require('./config.json');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Reaction, Partials.Message]
});
// define everything

/**
 * Client Ready
 */

client.on(Events.ClientReady, async () => {
  console.log(
    `[BOT]: Client is online!\n  Server Count: ${client.guilds.cache.size}`
  );
  client.counts = {
    commandsRan: 0,
    messagesRead: 0
  };
  client.db = {
    afks: []
  };

  for (const afkUser of await require('./database/afk').find()) {
    client.db.afks.push(afkUser.userId);
  }
});

/**
 * Client Ready
 */

/**
 * Database Handling
 */

mongoose.connect(process.env.mongopath);

/**
 * Database Handling
 */

/**
 * COMMAND HANDLING
 */

client.cmd = {
  commands: new Collection(),
  cooldowns: new Collection()
};
const { cooldowns } = client.cmd;
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((s) => s.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.cmd.commands.set(command.name, command);
  }
}

client.on(Events.MessageCreate, async (message) => {
  client.counts.messagesRead++;
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const commandName = args.shift().toLowerCase();

  const command =
    client.cmd.commands.get(commandName) ||
    client.cmd.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName.toLowerCase())
    ) ||
    null;

  if (!command) return;
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = new Date();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmt = (command.cooldown || 0) * 1000;

  if (timestamps.has(message.author.id)) {
    const expTime = timestamps.get(message.author.id) + cooldownAmt;

    if (now < expTime) {
      const timeLeft = (expTime - now) / 1000;

      return message.reply({
        embeds: [
          {
            description: `**:x: You must wait ${Math.ceil(
              timeLeft
            )}s before running that command again.**`,
            color: 'Red'
          }
        ]
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmt);

  // requirements
  if (command?.roles && !message.member.roles.cache.hasAny(...command.roles)) {
    return message.reply({
      content: `You need one of these roles to run this command:\n${command.roles
        .map((role) => `<@&${role}>`)
        .join(' ')}`,
      allowedMentions: {
        roles: [],
        users: []
      }
    });
  }

  try {
    command.execute(message, args, client);
    client.counts.commandsRan++;
  } catch (e) {
    console.log(e);
    return message.reply({
      content: 'There was an error running this command.'
    });
  }
});
/**
 * COMMAND HANDLING
 */

/**
 * EVENT HANDLING
 */

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

/**
 * EVENT HANDLING
 */

client.on(Events.Error, console.log);
client.login(process.env.token);
