import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { prefix } from '../../tsconfig.json';

export default function commandHandler(client: any) {
  // Initialize collections
  client.commands = new Map();
  client.slashCommands = new Map();
  client.cooldowns = new Map();

  // Load prefixed commands
  const commandFolders = fs.readdirSync('./commands');

  // Load slash commands
  const slashCommandsPath = path.join(__dirname, '../slash-commands');
  const slashCommandFolders = fs.readdirSync(slashCommandsPath);

  for (const folder of slashCommandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter((file) => file.endsWith('.ts'));
    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`);
      client.commands.set(command.name, command);
    }
  }

  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(path.join(slashCommandsPath, folder))
      .filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
      const command = require(path.join(slashCommandsPath, folder, file));
      if ('data' in command && 'execute' in command) {
        client.slashCommands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] Command ${file} is missing required properties`);
      }
    }
  }
}
