import { Events, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';

export default function eventHandler(client: any) {
  // Load events
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.ts'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args: any[]) =>
        event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args: any[]) => event.execute(...args, client));
    }
  }

  const prefix = 'fh';

  // MessageCreate event for prefixed commands
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      [...client.commands.values()].find((cmd: any) =>
        cmd.aliases?.includes(commandName)
      );

    if (!command) return;

    try {
      await command.execute(message, args, client);
      client.counts.commandsRan++;
    } catch (error) {
      console.error(error);
      message.reply('There was an error executing that command!');
    }
  });

  // InteractionCreate event for slash commands
  client.on(Events.InteractionCreate, async (interaction: any) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error executing this command!',
        ephemeral: true
      });
    }
  });
}
