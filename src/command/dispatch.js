const config = require('../config');
const cooldowns = require('./cooldowns');
const { CommandStatsService } = require('../database/services/commandStatsService');
const logger = require('../utils/logger');
const { warningEmbed, neutralEmbed, errorEmbed, replyError } = require('../utils/embeds');

function createPrefixHandler(client) {
  return async (message) => {
    if (client.state.shuttingDown || message.author?.bot || !message.guild) return;
    let command;
    try {
      client.state.counts.messagesRead++;
      client.state.counts.activeUsers.add(message.author.id);
      const content = message.content || '';
      if (!content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;
      const args = content.slice(config.prefix.length).trim().split(/\s+/);
      const name = args.shift().toLowerCase();
      command = client.state.commands.get(name);
      if (!command) return;

      // Denied attempts must not consume the command's cooldown.
      if (command.requiredRoles?.length &&
          !message.member?.roles.cache.hasAny(...command.requiredRoles)) {
        await message.reply({
          content: `You need one of these roles:\n${command.requiredRoles.map((role) => `<@&${role}>`).join(' ')}`,
          allowedMentions: { parse: [], repliedUser: false }
        });
        return;
      }
      const cooldown = cooldowns.check(message.author.id, command.name, command.cooldown);
      if (!cooldown.allowed) {
        await message.reply({
          embeds: [warningEmbed({ description: `Please wait ${cooldown.remaining}s before using that command again.` })]
        });
        return;
      }

      await command.execute(message, args, client);
      client.state.counts.commandsRan++;
      void CommandStatsService.track({
        guildId: message.guild.id,
        commandName: command.name,
        commandType: 'prefix'
      }).catch((error) => logger.error('Command statistics failed', error));
      const logChannel = client.channels.cache.get(config.ids.channels.commandLog);
      if (typeof logChannel?.send === 'function') {
        void logChannel.send({
          embeds: [neutralEmbed({
            author: { name: message.author.tag, iconURL: message.author.displayAvatarURL() },
            title: command.name,
            fields: [
              { name: 'Commands Ran', value: client.state.counts.commandsRan.toLocaleString(), inline: true },
              { name: 'Server', value: message.guild.name, inline: true }
            ]
          })]
        }).catch((error) => logger.warn('Could not log command usage', error));
      }
    } catch (error) {
      logger.error(`Command "${command?.name || 'dispatch'}" error`, error);
      await replyError(message, 'There was an error running this command.');
    }
  };
}

function createSlashHandler(client) {
  return async (interaction) => {
    if (client.state.shuttingDown || !interaction.isChatInputCommand()) return;
    const command = client.state.slashCommands.get(interaction.commandName);
    if (!command) {
      logger.warn(`No matching slash command: ${interaction.commandName}`);
      return;
    }
    try {
      await command.execute(interaction, client);
      client.state.counts.slashCommandsRan++;
      void CommandStatsService.track({
        guildId: interaction.guildId,
        commandName: command.data.name,
        commandType: 'slash'
      }).catch((error) => logger.error('Command statistics failed', error));
    } catch (error) {
      logger.error(`Slash command "${interaction.commandName}" error`, error);
      const payload = { embeds: [errorEmbed({ description: 'There was an error while executing this command!' })] };
      // Complete an outstanding deferred reply instead of leaving "thinking" visible.
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        const method = interaction.replied ? 'followUp' : 'reply';
        await interaction[method]({ ...payload, flags: 64 }).catch(() => {});
      }
    }
  };
}

module.exports = { createPrefixHandler, createSlashHandler };
