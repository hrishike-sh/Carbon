const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'redtea',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  execute: async (message, args) => {
    if (message.channel.type != ChannelType.GuildText) return;

    const joinEmbed = createEmbed({
      title: 'Red Tea',
      footer: 'Click the button to join.'
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

    const gamedata = [];

    const collector = joinMessage.createMessageComponentCollector({
      maxUsers: 10,
      time: 5
    });

    collector.on('collect', async (button) => {
      const user = button.user;
      const gameUser = gamedata.find((a) => a.userId == user.userId)[0];
      if (gameUser) {
        return button.reply({
          ephemeral: true,
          content: 'You have already joined this game you moneky'
        });
      } else {
        gamedata.push({
          userId: user.id,
          words: 0,
          out: false
        });

        button.reply({
          content: 'You have joined the game!',
          ephemeral: true
        });
      }
    });

    collector.on('end', async () => {
      await message.channel.send({
        embeds: [
          createEmbed({ title: 'Redtea game is now starting!' })
        ]
      });


    });
  }
};
