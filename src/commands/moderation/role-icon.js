const { Message, Client } = require('discord.js');
module.exports = {
  name: 'roleicon',
  /**
   * Executes the command asynchronously.
   * @param {Message} message - The message object representing the message that triggered the command.
   * @param {Array} args - An array of strings containing the arguments passed to the command.
   * @param {Client} client - The client object representing the Discord bot.
   * @return {Promise<void>} A promise that resolves when the command execution is complete.
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1016728636365209631')) return;

    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply('Please specify a role!');
    const link = args.pop();

    if (!link) return message.reply('Please specify a link!');

    await role.setIcon(link);
    return message.react('✅');
  }
};
