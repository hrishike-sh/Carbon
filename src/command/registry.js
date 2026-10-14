const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const PrefixCommand = require('./PrefixCommand');
const SlashCommand = require('./SlashCommand');
const logger = require('../utils/logger');

function commandFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((category) => fs.readdirSync(path.join(directory, category.name), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => ({
        category: category.name,
        filePath: path.join(directory, category.name, entry.name)
      })));
}

function isCommandName(value) {
  return typeof value === 'string' && value.length > 0 &&
    value === value.toLowerCase() && !/\s/.test(value);
}

function loadPrefixCommands(directory = path.join(__dirname, '..', 'commands')) {
  const commands = new Collection();
  const loaded = [];
  const errors = [];

  for (const { category, filePath } of commandFiles(directory)) {
    try {
      const definition = require(filePath);
      if (definition.disabled === true) continue;
      if (!isCommandName(definition.name) || typeof definition.execute !== 'function' ||
          (definition.aliases !== undefined && (!Array.isArray(definition.aliases) ||
            !definition.aliases.every(isCommandName))) ||
          (definition.cooldown !== undefined &&
            (!Number.isFinite(definition.cooldown) || definition.cooldown < 0)) ||
          (definition.roles !== undefined && (!Array.isArray(definition.roles) ||
            !definition.roles.every((role) => typeof role === 'string' && role.length > 0)))) {
        throw new TypeError('Invalid prefix command export');
      }
      if (commands.has(definition.name)) {
        throw new Error(`Duplicate command name "${definition.name}"`);
      }
      const command = new PrefixCommand(definition);
      command.category = category;
      commands.set(command.name, command);
      loaded.push(command);
    } catch (cause) {
      errors.push(new Error(`Failed to load ${filePath}: ${cause.message}`, { cause }));
    }
  }

  // Register names first so an alias can never silently replace a real command.
  for (const command of loaded) {
    for (const alias of command.aliases) {
      const existing = commands.get(alias);
      if (existing && existing !== command) {
        errors.push(new Error(`Alias "${alias}" for "${command.name}" conflicts with "${existing.name}"`));
      } else {
        commands.set(alias, command);
      }
    }
  }
  if (errors.length) throw new AggregateError(errors, 'Prefix command loading failed');
  return commands;
}

function loadSlashCommands(directory = path.join(__dirname, '..', 'slash-commands')) {
  const commands = new Collection();
  const errors = [];
  for (const { filePath } of commandFiles(directory)) {
    try {
      const definition = require(filePath);
      if (definition.disabled === true) continue;
      if (typeof definition.data?.toJSON !== 'function' || typeof definition.execute !== 'function') {
        throw new TypeError('Invalid slash command export');
      }
      const data = definition.data.toJSON();
      if (!isCommandName(data.name)) throw new TypeError('Invalid slash command name');
      if (commands.has(data.name)) throw new Error(`Duplicate slash command name "${data.name}"`);
      commands.set(data.name, new SlashCommand(definition));
    } catch (cause) {
      errors.push(new Error(`Failed to load ${filePath}: ${cause.message}`, { cause }));
    }
  }
  if (errors.length) throw new AggregateError(errors, 'Slash command loading failed');
  return commands;
}

function loadCommands(client) {
  const commands = loadPrefixCommands();
  const slashCommands = loadSlashCommands();
  client.state.commands = commands;
  client.state.slashCommands = slashCommands;
  logger.info(`Loaded ${new Set(commands.values()).size} prefix commands (${commands.size} names and aliases)`);
  logger.info(`Loaded ${slashCommands.size} slash commands`);
}

module.exports = { loadCommands, loadPrefixCommands, loadSlashCommands };