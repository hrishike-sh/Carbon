const { Message, Client, Permissions, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'unlockdown',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('You must be an administrator to use this command.')
            .setColor('RED')
        ]
      });
    }

    const channelList = ['833727597057802240'];

    for (const channelId of channelList) {
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SEND_MESSAGES: true
        });
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription('**Lockdown has been lifted.**')
              .setColor('GREEN')
          ]
        });
      }
    }

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('Unlockdown initiated.')
          .setColor('GREEN')
      ]
    });
  }
};
