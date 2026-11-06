const { ChannelType } = require('discord.js');
const config = require('../../config');
const { cancel, start } = require('../../utils/tournament');

module.exports = {
  name: 'tournament',
  description: 'Host a single-elimination FightHub tournament.',
  roles: [config.roles.staff.mod],

  async execute(message, args) {
    if (message.guild.id !== config.guildId || message.channel.type !== ChannelType.GuildText) {
      return message.reply('Tournaments are only available in FightHub text channels.');
    }

    if (args.length === 1 && args[0].toLowerCase() === 'cancel') return cancel(message);
    return start(message);
  }
};
