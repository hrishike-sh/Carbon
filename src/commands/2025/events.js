const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  ButtonInteraction
} = require('discord.js');

const EVENTS = ['find_the_ball', 'emoji_memory', 'basketball', 'crab_race', 'higher_or_lower', 'unscramble', 'rock_paper_scissors'];

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
    } else if (index == 3) {
      const joinEmbed = new EmbedBuilder()
        .setTitle('Crab Race :crab:')
        .setDescription(
          `Click the button to join the **Crab Race**!\n\nGame starts in **30 seconds**`
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
              `**${track.user.tag}**:\n:squid:${track.track.join(' ')} :crab:`
          )
          .join('\n');

        const mainMessage = await message.channel.send({
          embeds: [
            {
              description,
              title: 'Crab Race',
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
            if (rand > 9) blocks = 5;

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
                  track.track.length < 1 ? ':crown:' : ':squid:'
                }${track.track.join(' ')} :crab:`
            )
            .join('\n');
          mainMessage.edit({
            embeds: [
              {
                description,
                title: 'Crab Race',
                color: Colors.Green,
                timestamp: new Date()
              }
            ]
          });
          if (description.includes(':crown:')) {
            const winner = gamedata.tracks.find((t) => t.track.length == 0);

            mainMessage.reply(`${winner.user.toString()} has won! :tada:`);
            break;
          }
        }
      });
    } else if (index == 4) {
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      let reference = Math.floor(Math.random() * 100) + 1;
      while (reference == randomNumber) {
        reference = Math.floor(Math.random() * 100) + 1;
      }
      const embed = new EmbedBuilder()
        .setTitle('Higher or Lower')
        .setDescription(
          `I have chosen a number, is it Higher or Lower than **${reference}**?`
        )
        .setFooter({
          text: 'Summer Event'
        })
        .setColor(Colors.Yellow);
      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setLabel('Higher')
          .setCustomId('hol_high')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel('Lower')
          .setCustomId('hol_low')
          .setStyle(ButtonStyle.Danger)
      ]);

      const mainMessage = await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      const data = new Set();

      collector.on('collect', async (button) => {
        if (!data.has(message.author.id)) {
          data.add(message.author.id);
        } else {
          return button.reply({
            embeds: [
              {
                title: ':x: You have already guessed!',
                color: Colors.Red
              }
            ],
            ephemeral: true
          });
        }
        const what = button.customId;
        if (what == 'hol_high' && randomNumber > reference) {
          message.channel.send({
            content: `${button.user} won "coins"`
          });
          button.reply({
            content: `You're correct! The number was ${randomNumber}`,
            ephemeral: true
          });
        } else if (what == 'hol_low' && randomNumber < reference) {
          button.reply({
            content: `You're correct! The number was ${randomNumber}`,
            ephemeral: true
          });
        } else {
          button.reply({
            content: `You got it wrong! The number was ${randomNumber}`,
            ephemeral: true
          });
        }
      });

      collector.on('end', (a) => {
        //
      });
    } else if (index == 5) {
      const req = await fetch(
        'https://random-word-api.vercel.app/api?words=1&length=4'
      );
      const word = (await req.json())[0];
      console.log(word);
      let scrambled = word
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
      while (scrambled == word) {
        scrambled = word
          .split('')
          .sort(() => Math.random() - 0.5)
          .join('');
      }

      const embed = new EmbedBuilder()
        .setTitle('Guess the word!')
        .setColor(Colors.Yellow)
        .setFooter({
          text: 'You get one try only!'
        })
        .setDescription(`Scrambled word: **\`${scrambled}\`**`);

      await message.channel.send({
        embeds: [embed]
      });

      const messageCollector = await message.channel.createMessageComponentCollector({
        time: 30_000
      });
      const s = new Set();
      messageCollector.on('collect', async (msg) => {
        if (s.has(msg.author.id)) return;
        if (msg.author.bot) return;
        if (msg.content.toLowerCase() == word) {
          await msg.reply({
            embeds: [
              {
                title: 'You got the word! It was ' + word,
                color: Colors.Green
              }
            ]
          });
          messageCollector.stop();
          s.add(msg.author.id);
        } else {
          msg.react('❌');
          s.add(msg.author.id);
        }
      });
    } else if (index == 6) {
      const embed = new EmbedBuilder()
        .setTitle('Rock, Paper, Scissors')
        .setDescription('Choose your weapon!')
        .setColor(Colors.Yellow);

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId('rock')
          .setLabel('Rock')
          .setEmoji('🪨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('paper')
          .setLabel('Paper')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('scissors')
          .setLabel('Scissors')
          .setEmoji('✂️')
          .setStyle(ButtonStyle.Primary)
      ]);

      const mainMessage = await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      const played = new Set();

      collector.on('collect', async (button) => {
        if (played.has(button.user.id)) {
          return button.reply({
            content: 'You have already played!',
            ephemeral: true
          });
        }

        played.add(button.user.id);

        const userChoice = button.customId;
        const botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];

        let result;
        if (userChoice === botChoice) {
          result = "It's a tie!";
        } else if (
          (userChoice === 'rock' && botChoice === 'scissors') ||
          (userChoice === 'paper' && botChoice === 'rock') ||
          (userChoice === 'scissors' && botChoice === 'paper')
        ) {
          result = 'You win!';
        } else {
          result = 'You lose!';
        }

        await button.reply({
          content: `You chose ${userChoice}, I chose ${botChoice}. ${result}`,
          ephemeral: true
        });
      });

      collector.on('end', () => {
        mainMessage.edit({
          components: []
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
