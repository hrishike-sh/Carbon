const {
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  name: 'turtlerace',
  roles: ['858088054942203945', '824687526396297226'],
  cooldown: 120,
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const joinEmbed = new EmbedBuilder()
      .setTitle('Turtle Race :turtle:')
      .setDescription(
        `Click the button to join the **Turtle Race**!\n\nGame starts in **30 seconds**`
      )
      .setColor('Yellow');
    const joinButton = new ButtonBuilder()
      .setLabel('Join')
      .setCustomId('join;tr')
      .setStyle(ButtonStyle.Success);
    const joinRow = new ActionRowBuilder().addComponents([joinButton]);
    const joinMessage = await message.channel.send({
      embeds: [joinEmbed],
      components: [joinRow]
    });
    const joinCollector = joinMessage.createMessageComponentCollector({
      time: 30_000
    });

    const gamedata = {
      joined: [],
      tracks: []
    };

    joinCollector.on('collect', async (button) => {
      if (gamedata.joined.includes(button.user.id)) {
        return button.reply({
          content: 'You have already joined the game',
          ephemeral: true
        });
      }
      gamedata.joined.push(button.user.id);
      if (gamedata.joined.length == 10) {
        joinCollector.stop();
      }
    });
    joinCollector.on('end', async () => {
      joinButton.setDisabled();
      joinMessage.edit({
        components: [joinRow]
      });

      if (gamedata.joined.length < 2) {
        return message.reply('You need atleast 2 players to play this game.');
      }

      for (const userId of gamedata.joined) {
        gamedata.tracks.push({
          user: message.guild.members.cache.get(userId) || {},
          track: [
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●',
            '●'
          ]
        });
      }

      const description = gamedata.tracks
        .map(
          (track) =>
            `**${track.user.tag}**:\n:carrot:${track.track.join(' ')} :turtle:`
        )
        .join('\n');

      message.channel.send({
        embeds: [
          {
            description
          }
        ]
      });
    });
  }
};
