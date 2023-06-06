const {
  Message,
  Client,
  Colors,
  EmbedBuilder,
  ActionRow,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Collection
} = require('discord.js');

module.exports = {
  name: 'amongus',
  aliases: ['amogus'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    return message.reply("It don't work.");

    if (!message.member.permissions.has('ManageGuild'))
      return message.reply('no');

    // vars
    const emojiIds = [
      '917726679214985246',
      '917726744457383936',
      '917726831485026314',
      '917726919062077490',
      '917726981964058624',
      '917727061651640350',
      '917727115183530044',
      '917727205453365278',
      '917727491660083220',
      '917727535704457237'
    ];
    // vars

    const joinMessage = await message.channel.send({
      embeds: [
        {
          title:
            'Among Us ' +
            client.emojis.cache.get('917726679214985246').toString(),
          description:
            'Click the **Join** button to enter the game!\n\nMax players: **10**',
          color: Colors.Green
        }
      ],
      components: [
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setLabel('Join')
            .setEmoji('917726679214985246')
            .setCustomId('join;amongus')
            .setStyle(ButtonStyle.Success)
        ])
      ]
    });

    const joinCollector = joinMessage.createMessageComponentCollector({
      time: 10_000
    });

    const DATA = {
      joined: [],
      players: new Collection()
    };

    joinCollector.on('collect', async (button) => {
      if (DATA.joined.includes(button.user.id)) {
        return button.reply({
          content: `You have already joined this game.`,
          ephemeral: true
        });
      }
      if (DATA.joined.length == 9) {
        DATA.joined.push(button.user.id);
        DATA.players.set(button.user.id, {
          user: button.user,
          emoji: emojiIds[DATA.joined.length - 1]
        });
        return joinCollector.stop();
      }

      DATA.joined.push(button.user.id);
      DATA.players.set(button.user.id, {
        user: button.user,
        emoji: emojiIds[DATA.joined.length - 1]
      });
    });

    joinCollector.on('end', async () => {
      joinMessage.edit({
        components: [],
        content: 'GAME WILL START!'
      });

      if (DATA.joined.length < 2)
        return message.channel.send(
          'You need atleast 4 players to play this game...'
        );

      const showEmbedAndRules = new EmbedBuilder()
        .setTitle(
          `${client.emojis.cache
            .get('917726679214985246')
            .toString()} Among Us ${client.emojis.cache
            .get('917726679214985246')
            .toString()}`
        )
        .setDescription(
          '**HOW TO WIN**:\n\n__Impostor__:\n> Send atleast 15 messages in order to win!\n__Crewmate__:\n> Start an Emergency Meeting by typing __emergency__ in chat and vote out whoever is sus!'
        )
        .setFooter({
          text: "Game starts in 15 seconds. You will be DM'd your roles shortly!"
        });

      const components = [new ActionRowBuilder(), new ActionRowBuilder()];
      for (let i = 0; i < DATA.joined.length; i++) {
        if (i < 5) {
          const user = DATA.players.get(DATA.joined[i]);
          components[0].addComponents(
            new ButtonBuilder()
              .setCustomId(`${DATA.joined[i]}.${emojiIds[i]}}`)
              .setLabel(user.user.username)
              .setEmoji(user.emoji)
              .setStyle(ButtonStyle.Primary)
          );
        } else {
          const user = DATA.players.get(DATA.joined[i]);
          components[1].addComponents(
            new ButtonBuilder()
              .setCustomId(`${DATA.joined[i]}.${emojiIds[i]}}`)
              .setLabel(user.user.username)
              .setEmoji(user.emoji)
              .setStyle(ButtonStyle.Primary)
          );
        }
      }

      message.channel.send({
        embeds: [showEmbedAndRules],
        components:
          components[1].components.length > 0 ? components : [components[0]]
      });
    });
  }
};
