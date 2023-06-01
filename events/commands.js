const fs = require('fs');
const { Collection } = require('discord.js');

module.exports = {
  name: 'commands',
  async execute(x, client) {
    client.c.commands = new Collection();
    const commandDir = './commands';
    const commandFolders = fs.readdirSync(commandDir);

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`${commandDir}/${folder}`)
        .filter((file) => file.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(`${commandDir}/${folder}/${file}`);
        client.c.commands.set(command.name, command);
      }
    }
  }
};
