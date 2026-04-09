const {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

module.exports = {
  name: 'redtea',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  execute: async (message, args) => {
    const perms = message.member.roles.cache.hasAny(['826002228828700718']);
    if (!perms) {
      return message.reply(
        'You do not have the right permissions to run this command!'
      );
    }

    if (message.channel.type != ChannelType.GuildText) return;

    const joinEmbed = new EmbedBuilder().setTitle('☕ Red Tea').setFooter({
      text: 'Click the button to join.'
    });

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId('join')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success)
    ]);

    const joinMessage = await message.channel.send({
      embeds: [joinEmbed],
      components: [row]
    });
  }
};
