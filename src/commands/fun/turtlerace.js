const {
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Colors
} = require('discord.js');

module.exports = {
  name: 'turtlerace',
  roles: ['858088054942203945', '824687526396297226'],
  cooldown: 120,
  /**
   *
   * @param {Message} message
   */
  async execute(message, args, client) {
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

      button.reply({
        content: 'You have joined the game!',
        ephemeral: true
      });
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
          user: client.users.cache.get(userId),
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
            '●'
          ]
        });
      }

      let description = gamedata.tracks
        .map(
          (track) =>
            `**${track.user.tag}**:\n:leafy_green:${track.track.join(
              ' '
            )} :turtle:`
        )
        .join('\n');

      const mainMessage = await message.channel.send({
        embeds: [
          {
            description,
            title: 'Turtle Race',
            color: Colors.Green,
            timestamp: new Date()
          }
        ]
      });
      let end = false;
      for (let i = 0; i < 50; i++) {
        if (end == true) continue;
        for (const track of gamedata.tracks) {
          console.log(track);
          const rand = Math.ceil(Math.random() * 10);
          let blocks = 0;
          if (rand < 6) blocks = 2;
          if (rand > 5 && rand < 10) blocks = 3;
          if (rand > 9) blocks = 10;

          if (track.length < blocks) {
            blocks = track.length;
            end = true;
            track.track.splice(0, blocks);
          } else {
            track.track.splice(0, blocks);
          }
        }
        await sleep(2500);
        description = gamedata.tracks
          .map(
            (track) =>
              `**${track.user.tag}**:\n${
                track.track.length < 1 ? ':crown:' : ':leafy_green:'
              }${track.track.join(' ')} :turtle:`
          )
          .join('\n');
        mainMessage.edit({
          embeds: [
            {
              description,
              title: 'Turtle Race',
              color: Colors.Green,
              timestamp: new Date()
            }
          ]
        });
        if (description.includes(':crown:')) {
          break;
          return;
        }
      }
    });
  }
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
