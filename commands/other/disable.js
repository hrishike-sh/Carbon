const { Message, Client } = require('discord.js');
const db = require('../../database/models/settingsSchema');

module.exports = {
  name: 'disable',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   * @returns
   */
  async execute(message, args, client) {
    let server = await db.findOne({ guildID: message.guild.id });

    if (!server) {
      server = new db({
        guildID: message.guild.id,
        disabled: {}
      }).save();
    }

    if (!args[0])
      return message.channel.send(`Please provide a valid command name.`);

    const commandName = args[0].toLowerCase();
    const command = client.c.commands.get(commandName);

    if (!command)
      return message.channel.send(
        `No such command with name ${command} was found...`
      );

    args.shift();

    if (!args[0])
      return message.channel.send(`Please tag a channel or give its id.`);

    let channel = message.mentions.channels.first().id || args[0];

    channel = message.guild.channels.cache.get(channel) || null;

    if (!channel) {
      return message.channel.send(`Could not find any channel with that id!`);
    }

    client.c.disabledCommands.set(message.channel.id, [
      ...client.c.disabledCommands.get(message.channel.id),
      command
    ]);

    return message.channel.send(
      `The command should now be disabled (temporarily).`
    );
  }
};
