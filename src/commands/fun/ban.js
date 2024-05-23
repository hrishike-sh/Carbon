const { Message, Client } = require('discord.js');

module.exports = {
  name: 'ban',
  cooldown: 5,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (message.guildId !== '1243193733223022823') return;

    const target = message.mentions?.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.roles.cache.hasAny('1243194015487365202', '1243193938685460500'))
      return message.reply('You cannot ban them idiot.');

    message.reply(`would've banned ${target.toString()}`);
  }
};
