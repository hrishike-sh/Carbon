const { REST, Routes } = require('discord.js');
const { clientId, guildId } = require('./config');
const { loadSlashCommands } = require('./command/registry');

async function deployCommands() {
  require('dotenv').config();
  if (!process.env.token?.trim()) throw new Error('Missing required environment variable: token');

  // Use the same validation as startup; never deploy a silently incomplete list.
  const commands = [...loadSlashCommands().values()].map((command) => command.data.toJSON());
  if (commands.length === 0) throw new Error('No slash commands found; refusing to erase registered commands');
  const rest = new REST().setToken(process.env.token);
  console.log(`Started refreshing ${commands.length} application (/) commands.`);
  const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  console.log(`Successfully reloaded ${data.length} application (/) commands.`);
}

if (require.main === module) {
  deployCommands().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { deployCommands };