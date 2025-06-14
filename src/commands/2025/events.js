const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} = require('discord.js');

const EVENTS = ['find_the_ball', 'emoji_memory'];

module.exports = {
  name: 'events',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const index = args[0] ?? Math.floor(Math.random() * EVENTS.length);

    if (index == 0) {
      // find the ball

      const ballEmbed = new EmbedBuilder()
        .setTitle('Guess where the ball is!')
        .setColor(Colors.Yellow)
        .setFooter({
          text: 'You get one try! Click the button to guess!'
        });

      const row = new ActionRowBuilder().addComponents(
        [
          new ButtonBuilder()
            .setCustomId('ball')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('not_ball_1')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('not_ball_2')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
        ].sort(() => Math.random() - 0.5)
      );

      await message.channel.send({
        embeds: [ballEmbed]
      });

      const mainMessage = await message.channel.send({
        content:
          '<:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>',
        components: [row]
      });
      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      collector.on('collect', async (button) => {
        button.reply(button.customId);
      });
    } else if (index == 1) {
      const emojis = [
        '🏊',
        '👡',
        '😎',
        '🌻',
        '🏝️',
        '🕶️',
        '👕',
        '🌴',
        '☀️',
        '👙',
        '🌞',
        '🍹',
        '🏄',
        '🥵',
        '🩱',
        '🩴',
        '🩳',
        '🍦',
        '🍨',
        '🧢',
        '🌄',
        '🌅',
        '🌡️',
        '🌊',
        '🥥'
      ].sort(() => Math.random() - 0.5);

      const toShow = emojis.slice(0, 5);

      const mainMessage = await message.channel.send({
        content: 'Memorise the following emojis!'
      });

      for await (const emoji of toShow) {
        await sleep(1500);
        await mainMessage.edit({
          content: emoji
        });
      }

      await sleep(1000);
      const mainEmbed = new EmbedBuilder()
        .setTitle('Memorize')
        .setDescription('Now click the emojis in order to win!')
        .setColor(Colors.Yellow)
        .setFooter({
          text: 'You get one try only!'
        });
      const p = emojis.slice(0, 10).sort(() => Math.random() - 0.5);
      const row = [
        new ActionRowBuilder().addComponents([
          ...p.slice(0, 5).map((emoji) => {
            return new ButtonBuilder()
              .setCustomId(emoji)
              .setEmoji(emoji)
              .setStyle(ButtonStyle.Secondary);
          })
        ]),
        new ActionRowBuilder().addComponents([
          ...p.slice(5, 10).map((emoji) => {
            return new ButtonBuilder()
              .setCustomId(emoji)
              .setEmoji(emoji)
              .setStyle(ButtonStyle.Secondary);
          })
        ])
      ];

      await mainMessage.edit({
        content: '',
        embeds: [mainEmbed],
        components: row
      });

      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      const gameData = new Collection();

      collector.on('collect', async (button) => {
        if (!gameData.has(message.author.id)) {
          gameData.set(message.author.id, {
            failed: false,
            correct: 0,
            won: false
          });
        }

        const user = gameData.get(message.author.id);
        if (user.failed) {
          return button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'You have already failed this game!',
                color: Colors.Red
              }
            ]
          });
        }
        if (user.won) {
          return button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'You have already won this game!',
                color: Colors.Green
              }
            ]
          });
        }
        if (toShow[user.correct] == button.customId) {
          user.correct++;
          if (user.correct == toShow.length) {
            user.won = true;
            button.reply({
              ephemeral: true,
              embeds: [
                {
                  description: 'You won!',
                  color: Colors.Green
                }
              ]
            });
          } else {
            button.reply({
              ephemeral: true,
              embeds: [
                {
                  description: 'Correct! Guess the next emoji',
                  color: Colors.Green
                }
              ]
            });
          }
        } else {
          user.failed = true;
          button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'Incorrect! You lost!',
                color: Colors.Red
              }
            ]
          });
        }
      });
    } else if (index == 2) {
      const arr = [
        [
          '<:canvas:1383477236291600525>',
          '<:canvas:1383477236291600525>',
          '<:canvas:1383477236291600525>'
        ],
        [
          '<:blank:914473340129906708>',
          '<:lebron_james:1383477589670236301>',
          '<:blank:914473340129906708>'
        ],
        [
          '<:blank:914473340129906708>',
          '<:blank:914473340129906708>',
          '<:blank:914473340129906708>'
        ]
      ];

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setEmoji('🏀')
          .setCustomId('0')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setEmoji('🏀')
          .setCustomId('1')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setEmoji('🏀')
          .setCustomId('2')
          .setStyle(ButtonStyle.Secondary)
      ]);

      const mainMessage = await message.channel.send({
        content:
          arr[0].join('') +
          '\n' +
          shuffle(arr[1]).join('') +
          '\n' +
          arr[2].join(''),
        components: [row]
      });

      const intervalId = setInterval(async () => {
        const shuffledArr = shuffle(arr[1]);
        await mainMessage.edit({
          content:
            arr[0].join('') +
            '\n' +
            shuffledArr.join('') +
            '\n' +
            arr[2].join('')
        });
        arr[1] = shuffledArr;
      }, 1000);
      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });
      const gamedat = new Collection();
      collector.on('collect', async (button) => {
        if (!gamedat.has(message.author.id)) {
          gamedat.set(message.author.id, {
            failed: false,
            won: false
          });
        }

        const user = gamedat.get(message.author.id);
        if (user.failed) {
          return button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'You have already failed this game!',
                color: Colors.Red
              }
            ]
          });
        }
        if (user.won) {
          return button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'You have already won this game!',
                color: Colors.Green
              }
            ]
          });
        }

        const ind = parseInt(button.customId);

        if (arr[1][ind] != '<:lebron_james:1383477589670236301>') {
          user.won = true;
          collector.stop();
          message.channel.send({
            embeds: [
              {
                description: `${message.author} won!`,
                color: Colors.Green
              }
            ]
          });
          button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'You won!',
                color: Colors.Green
              }
            ]
          });
        } else {
          user.failed = true;
          button.reply({
            ephemeral: true,
            embeds: [
              {
                description: 'Incorrect! You lost!',
                color: Colors.Red
              }
            ]
          });
        }
      });

      collector.on('end', () => {
        clearInterval(intervalId);
        mainMessage.edit({
          components: [
            new ActionRowBuilder().addComponents([
              new ButtonBuilder()
                .setEmoji('🏀')
                .setCustomId('0')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setEmoji('🏀')
                .setCustomId('1')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setEmoji('🏀')
                .setCustomId('2')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            ])
          ]
        });
      });
    }
  }
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
