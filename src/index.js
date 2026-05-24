require('dotenv').config();

const config = require('./config');
const { createClient } = require('./client/Client');
const { connectDatabase } = require('./database');
const { loadCommands } = require('./command/registry');
const { loadEvents } = require('./event/registry');
const highlightModule = require('./events/messageCreate/highlight');
const settingsService = require('./database/services/settingsService');
const afkModel = require('./database/models/afk');
const cooldowns = require('./command/cooldowns');
const antiBot = require('./client/AntiBot');
const logger = require('./utils/logger');
const {
  warningEmbed,
  neutralEmbed,
  errorEmbed,
  replyError
} = require('./utils/embeds');
const { Events, Collection } = require('discord.js');

async function main() {
  const client = createClient();

  client.once(Events.ClientReady, async () => {
    console.log(`[BOT]: Client is online!\n  Server Count: ${client.guilds.cache.size}`);

    client.user.setPresence({ status: 'dnd' });

    // Load settings cache
    const settings = await settingsService.load();
    client.state.afkIgnore = settings.afkIgnore || [];

    // Load highlights into memory
    await highlightModule.load(client);

    // Load AFK users into memory
    const afkUsers = await afkModel.find();
    for (const afkUser of afkUsers) {
      client.state.afks.push(afkUser.userId);
    }

    // Trigger 2025 event scheduler
    client.emit('tick');

    // Leave small guilds (keep Carbon server and main guild)
    if (client.shard) {
      client.shard.broadcastEval((c) => {
        c.guilds.cache.forEach(async (guild) => {
          if (guild.id !== '856111404322258956' && guild.memberCount < 10) {
            await guild.leave().catch(() => {});
            console.log(`Left: ${guild.name}`);
          }
        });
      });
    }
  });

  await connectDatabase(process.env.mongopath);

  loadCommands(client);
  loadEvents(client);

  // Prefix command handler
  client.on(Events.MessageCreate, async (message) => {
    client.state.counts.messagesRead++;

    if (message.author.bot) return;
    if (!message.guild) return;

    const content = message.content;
    if (!content.toLowerCase().startsWith(config.prefix)) return;

    const args = content.slice(config.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.state.commands.get(commandName);
    if (!command) return;

    // Cooldown check
    const cooldownResult = cooldowns.check(message.author.id, command.name, command.cooldown);
    if (!cooldownResult.allowed) {
      return message.reply({
        embeds: [
          warningEmbed({
            description: `Please wait ${cooldownResult.remaining}s before using that command again.`
          })
        ]
      });
    }

    // Role check
    if (command.requiredRoles?.length &&
        !message.member.roles.cache.hasAny(...command.requiredRoles)) {
      return message.reply({
        content: `You need one of these roles:\n${command.requiredRoles.map((r) => `<@&${r}>`).join(' ')}`,
        allowedMentions: { roles: [], users: [] }
      });
    }

    try {
      await command.execute(message, args, client);
      client.state.counts.commandsRan++;

      const logChannel = client.channels.cache.get(config.ids.channels.commandLog);
      if (logChannel) {
        logChannel.send({
          embeds: [
            neutralEmbed({
              author: {
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
              },
              title: command.name,
              fields: [
                { name: 'Commands Ran', value: client.state.counts.commandsRan.toLocaleString(), inline: true },
                { name: 'Server', value: message.guild.name, inline: true }
              ]
            })
          ]
        }).catch(() => {});
      }
    } catch (err) {
      logger.error(`Command "${command.name}" error`, err);
      replyError(message, 'There was an error running this command.');
    }
  });

  // Slash command handler
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.state.slashCommands.get(interaction.commandName);
    if (!command) {
      logger.warn(`No matching slash command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Slash command "${interaction.commandName}" error`, err);
      const embed = errorEmbed({ description: 'There was an error while executing this command!' });
      const reply = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
      interaction[reply]({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  });

  // Global error handlers
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    const errorChannel = client.channels.cache.get(config.ids.channels.errorLog);
    if (errorChannel) {
      errorChannel.send({
        embeds: [
          errorEmbed({
            title: 'Uncaught Exception',
            description: `\`${err.message}\``
          })
        ]
      }).catch(() => {});
    }
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });

  client.on(Events.Error, (err) => {
    logger.error('Discord client error', err);
  });

  await client.login(process.env.token);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
