const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'unlockdown',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({
        embeds: [
          errorEmbed({ description: 'You must be an administrator to use this command.' })
        ]
      });
    }

    const channelList = ['833727597057802240'];

    for (const channelId of channelList) {
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: true
        });
        await channel.send({
          embeds: [
            successEmbed({ description: 'Lockdown has been lifted.' })
          ]
        });
      }
    }

    message.reply({
      embeds: [
        successEmbed({ description: 'Unlockdown initiated.' })
      ]
    });
  }
};
