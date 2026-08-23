const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const PrefixCommand = require('./PrefixCommand');
const SlashCommand = require('./SlashCommand');
const logger = require('../utils/logger');

function loadCommands(client) {
  const state = client.state;

  loadPrefixCommands(state);
  loadSlashCommands(state);
}

function loadPrefixCommands(state) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    logger.warn('Commands directory not found, skipping prefix commands');
    return;
  }

  const categories = fs.readdirSync(commandsPath);
  let loaded = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      try {
        const moduleExports = require(path.join(categoryPath, file));
        if (typeof moduleExports.name !== 'string' ||
            !moduleExports.name.trim() ||
            typeof moduleExports.execute !== 'function' ||
            (moduleExports.aliases &&
              (!Array.isArray(moduleExports.aliases) ||
                !moduleExports.aliases.every((alias) => typeof alias === 'string' && alias)))) {
          logger.warn(`Prefix command ${category}/${file} has an invalid export`);
          continue;
        }

        const command = new PrefixCommand(moduleExports);
        command.category = category;

        if (state.commands.has(command.name)) {
          logger.warn(`Duplicate prefix command name "${command.name}" in ${category}/${file}`);
          continue;
        }
        state.commands.set(command.name, command);
        for (const alias of command.aliases) {
          const existing = state.commands.get(alias);
          if (existing === command) continue;
          if (existing) {
            logger.warn(`Duplicate prefix command alias "${alias}" in ${category}/${file}`);
            continue;
          }
          state.commands.set(alias, command);
        }
        loaded++;
      } catch (err) {
        logger.error(`Failed to load prefix command ${category}/${file}`, err);
      }
    }
  }

  logger.info(`Loaded ${loaded} prefix commands (${state.commands.size} names and aliases)`);
}

function loadSlashCommands(state) {
  const slashPath = path.join(__dirname, '..', 'slash-commands');

  if (!fs.existsSync(slashPath)) {
    logger.warn('Slash commands directory not found, skipping');
    return;
  }

  const folders = fs.readdirSync(slashPath);

  for (const folder of folders) {
    const folderPath = path.join(slashPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      try {
        const moduleExports = require(path.join(folderPath, file));

        if (!moduleExports.data || !moduleExports.execute) {
          logger.warn(`Slash command ${folder}/${file} missing data or execute`);
          continue;
        }

        const command = new SlashCommand(moduleExports);
        state.slashCommands.set(command.data.name, command);
      } catch (err) {
        logger.error(`Failed to load slash command ${folder}/${file}`, err);
      }
    }
  }

  logger.info(`Loaded ${state.slashCommands.size} slash commands`);
}

module.exports = { loadCommands };
