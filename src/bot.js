// define everything
const {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  Message,
  Partials,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
  client.user.setPresence({
    status: 'dnd'
  });
  client.counts = {
    commandsRan: 0,
    messagesRead: 0
  };
  client.db = {
    afks: [],
    afkIgnore: (
      await require('./database/settingsSchema').findOne({
        guildID: '824294231447044197'
      })
    ).afkIgnore
  };
  client.snipes = {
    snipes: new Collection(),
    esnipes: new Collection()
  };
  client.cd = new Set();
  for (const afkUser of await require('./database/afk').find()) {
    client.db.afks.push(afkUser.userId);
  }

  client.shard.broadcastEval((c) => {
    c.guilds.cache.forEach(async (guild) => {
      if (guild.id == '856111404322258956') {
        console.log('Carbon Server Found');
      } else {
        if (guild.memberCount < 10) {
          guild.leave();
          console.log(`Left: ${guild.name}`);
        }
      }
    });
  });
});

/**
 * Client Ready
 */

/**
 * Database Handling
 */

mongoose.connect(process.env.mongopath, {
  useFindAndModify: false
});

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
const MAP = new Collection();
const CoinDB = require('./database/coins');
const processing = new Set();
/**
 *
 * @param {Message} message
 * @returns
 */
client.antiBot = async (message) => {
  if (!message.guild) return true;

  if (!MAP.has(message.author.id)) {
    MAP.set(message.author.id, 0);
  }
  if (processing.has(message.author.id)) {
    message.react('❌');
    return false;
  }
  const count = MAP.get(message.author.id);
  MAP.set(message.author.id, count + 1);
  if (count >= 25) {
    processing.add(message.author.id);
    const msg = await message.channel.send({
      content: message.author.toString(),
      embeds: [
        {
          title: 'Anti-Bot',
          color: Colors.Red,
          description: `Click the **RED** button to continue!`,
          footer: {
            text: 'Failing the captcha will get you banned. You have 10 seconds.'
          }
        }
      ],
      components: [
        new ActionRowBuilder().addComponents(
          [
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click'),
            new ButtonBuilder()
              .setCustomId(`${Math.random()}`)
              .setStyle(ButtonStyle.Success)
              .setLabel('Click')
          ].sort(() => Math.random() - 0.5)
        )
      ]
    });
    const collector = msg.createMessageComponentCollector({
      filter: (m) => m.user.id == message.author.id,
      time: 10_000,
      max: 1
    });
    let captcha = false;
    collector.on('collect', async (button) => {
      button.deferUpdate();
      if (button.component.style !== ButtonStyle.Danger) {
      } else {
        captcha = true;
      }
    });
    collector.on('end', async () => {
      if (!captcha) {
        const temp = await CoinDB.findOne({ userId: message.author.id });
        const u = await CoinDB.deleteOne({ userId: message.author.id });
        client.users.cache.get('598918643727990784').send({
          content: `${message.author.toString()} failed the captcha [Jump](${
            message.url
          })`,
          embeds: [
            {
              description: `Coins: ${temp.coins}`
            }
          ]
        });
        message.channel.send({
          content: `${message.author.toString()} you failed the captcha! All your coins are wiped.`
        });
        MAP.set(message.author.id, 0);
        processing.delete(message.author.id);

        return false;
      } else {
        MAP.set(message.author.id, 0);
        processing.delete(message.author.id);

        message.channel.send(
          `${message.author.toString()} you can continue using the bot!`
        );
        return true;
      }
    });
  } else return true;
};
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
  if (!client.cmd.cooldowns.has(command.name)) {
    client.cmd.cooldowns.set(command.name, new Collection());
  }

  const now = new Date();
  const timestamps = client.cmd.cooldowns.get(command.name);
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
            )}s before running that command again.**`
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
    client.channels.cache.get('913359587317522432').send({
      embeds: [
        {
          author: {
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL()
          },
          title: command.name,
          fields: [
            {
              name: 'Total Commands Ran',
              value: client.counts.commandsRan.toLocaleString()
            },
            {
              name: 'Server',
              value: message.guild.name,
              inline: true
            }
          ]
        }
      ]
    });
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
process.on('uncaughtException', (e) => {
  console.error(e);
  if (!e.message.includes('Unknown Message')) {
    client.channels.cache
      .get('1176219409149341817')
      .send('Error:\n' + e.message || 'a');
  }
  console.log('Bot didnt die.');
});
client.on(Events.Error, console.log);
client.login(process.env.token);
