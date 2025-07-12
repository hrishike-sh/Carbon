import { ButtonBuilder } from '@discordjs/builders';
import {
  Client,
  EmbedBuilder,
  Message,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ButtonStyle,
  ButtonInteraction,
  ModalSubmitInteraction,
  Interaction,
  Collection,
  User,
  TextChannel,
  Colors
} from 'discord.js';

module.exports = {
  name: 'imposters',
  execute: async (message: Message, args: String[], client: Client) => {
    const EVENT_MANAGER = '858088054942203945';
    let IMPOSTERS = 0;
    let WORD = '';
    if (!message.member?.roles.cache.has(EVENT_MANAGER)) return;
    if (message.author.id !== '598918643727990784') return;
    const askEmbed = new EmbedBuilder()
      .setTitle('<:amongus_red:917726679214985246> Imposter Game')
      .setColor('Red')
      .setDescription(
        `<:fh_bluedot:1128541545763717173> Imposters: Please select\n<:fh_bluedot:1128541545763717173> Word: Please select\n\n*Click the Start button to start the game.*`
      )
      .setTimestamp();

    const modal = new ModalBuilder()
      .setCustomId('imposters_setup')
      .setTitle('Setup Imposters Game')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('imposters_count')
            .setLabel('Imposters')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('word')
            .setLabel('Word')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(20)
            .setRequired(true)
        )
      );

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setLabel('Settings')
        .setCustomId('imposters_settings')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('Start')
        .setCustomId('imposters_start')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    ]);

    const SettingsMessage = await message.reply({
      embeds: [askEmbed],
      // @ts-ignore
      components: [row],
      fetchReply: true
    });

    const SettingsCollector = SettingsMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id
    });

    SettingsCollector.on('collect', async (i: ButtonInteraction) => {
      if (i.customId == 'imposters_settings') {
        await i.showModal(modal);

        const submitted = await i.awaitModalSubmit({
          time: 30_000,
          filter: (i: ModalSubmitInteraction) => i.user.id === message.author.id
        });

        await submitted.reply({
          content: 'Settings Saved!',
          ephemeral: true
        });

        IMPOSTERS = parseInt(
          submitted.fields.getTextInputValue('imposters_count')
        );
        WORD = submitted.fields.getTextInputValue('word');

        askEmbed.setDescription(
          `<:fh_bluedot:1128541545763717173> Imposters: ${IMPOSTERS}\n<:fh_bluedot:1128541545763717173> Word: :shushing_face:\n\n*Click the Start button to start the game.*`
        );
        // @ts-ignore
        row.components[1].setDisabled(false);

        await SettingsMessage.edit({
          embeds: [askEmbed],
          // @ts-ignore
          components: [row]
        });
      }

      if (i.customId == 'imposters_start') {
        await i.reply({
          content: 'Game Started!',
          ephemeral: true
        });

        SettingsCollector.stop();
      }
    });

    SettingsCollector.on('end', async () => {
      // lock channel
      const GameEmbed = new EmbedBuilder()
        .setTitle(`<:amongus_red:917726679214985246> Imposter Games`)
        .setColor('Yellow')
        .setDescription(
          `Click the "Join" button to join the game\n\n<:fh_bluedot:1128541545763717173> **Imposters:** ${IMPOSTERS}`
        )
        .setFooter({
          text: 'Game starts in 30 seconds.'
        });

      const GameRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setLabel('Join')
          .setStyle(ButtonStyle.Success)
          .setCustomId('imposters_join')
      ]);

      const GameJoinMessage = await message.reply({
        embeds: [GameEmbed],
        // @ts-ignore
        components: [GameRow]
      });

      const JoinCollector = GameJoinMessage.createMessageComponentCollector({
        time: 30_000
      });

      const PLAYERS: Map<
        string,
        { imposter: boolean; user: User; alive: boolean }
      > = new Map();

      JoinCollector.on('collect', async (joinButton: ButtonInteraction) => {
        // if (joinButton.user.id == message.author.id) {
        //   return joinButton.reply({
        //     content: "You cannot join this game because you're hosting it!",
        //     ephemeral: true
        //   });
        // }

        if (PLAYERS.has(joinButton.user.id)) {
          PLAYERS.delete(joinButton.user.id);

          await joinButton.reply({
            content: 'You left the game!',
            ephemeral: true
          });
          // @ts-ignore
          GameRow.components[0].setLabel(`Join [${PLAYERS.size}]`);

          await GameJoinMessage.edit({
            // @ts-ignore
            components: [GameRow]
          });
        } else {
          PLAYERS.set(joinButton.user.id, {
            imposter: false,
            alive: true,
            user: joinButton.user
          });

          await joinButton.reply({
            content: 'You joined the game!',
            ephemeral: true
          });

          // @ts-ignore
          GameRow.components[0].setLabel(`Join [${PLAYERS.size}]`);

          await GameJoinMessage.edit({
            // @ts-ignore
            components: [GameRow]
          });
        }
      });

      JoinCollector.on('end', async () => {
        for (let i = 0; i < IMPOSTERS; i++) {
          const PLAYERS_ARRAY = Array.from(PLAYERS.values());

          const imposter =
            PLAYERS_ARRAY[Math.floor(Math.random() * PLAYERS_ARRAY.length)];
          imposter.imposter = true;
        }

        for (const [id, player] of PLAYERS) {
          if (player.imposter) {
            const imposterEmbed = new EmbedBuilder()
              .setTitle("You're an IMPOSTER!!")
              .setDescription(
                'Your role is to guess the word others are talking about. You get ONE try! If you guess the wrong word, lose the game!'
              )
              .setColor('Red');

            await player.user.send({
              embeds: [imposterEmbed]
            });
          } else {
            const normalEmbed = new EmbedBuilder().setTitle(
              'Your word is ' + WORD
            );

            await player.user.send({
              embeds: [normalEmbed]
            });
          }
        }

        let running = true;
        let round = 1;

        while (running) {
          running = false;
          const Words: { id: string; word: string }[] = [];

          for (const [id, player] of PLAYERS) {
            if (player.alive) {
              Words.push({
                id,
                word: ''
              });
            }
          }

          const WriteEmbed = new EmbedBuilder()
            .setTitle(`Round ${round}`)
            .setDescription(
              `Everyone (except the imposter) was sent a word in their DMs! You now have to type a word similar to the one you were given.`
            )
            .addFields([
              {
                name: 'Waiting for..',
                value: `<:fh_dotblack:922314907771363419>${Words.map(
                  (a) => `<@${a.id}>`
                ).join('\n<:fh_dotblack:922314907771363419>')}`,
                inline: true
              },
              {
                name: 'Submitted',
                value: '',
                inline: true
              }
            ])
            .setColor('Yellow')
            .setFooter({
              text: 'Click the button below to submit your word! You have 30 seconds.'
            });

          const modal = new ModalBuilder()
            .setTitle('Submit your word')
            .setCustomId('imposters_submit_word')
            .addComponents(
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                  .setCustomId('word')
                  .setLabel('Word')
                  .setStyle(TextInputStyle.Short)
                  .setMinLength(3)
                  .setMaxLength(20)
                  .setRequired(true)
              )
            );

          const WriteRow = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setLabel('Submit Word')
              .setCustomId('imposters_submit_word')
              .setStyle(ButtonStyle.Primary)
          ]);

          const WriteMessage = await message.reply({
            embeds: [WriteEmbed],
            // @ts-ignore
            components: [WriteRow]
          });

          const WordCollector = WriteMessage.createMessageComponentCollector({
            time: 30_000 // THIS
          });

          WordCollector.on('collect', async (wordButton: ButtonInteraction) => {
            if (!PLAYERS.has(wordButton.user.id)) {
              return wordButton.reply({
                content: 'You are not in this game.',
                ephemeral: true
              });
            }

            if (!PLAYERS.get(wordButton.user.id)?.alive) {
              return wordButton.reply({
                content: "Dead users can't type!!",
                ephemeral: true
              });
            }

            await wordButton.showModal(modal);
            const submitted = await wordButton.awaitModalSubmit({
              time: 15_000,
              filter: (modalInt) =>
                modalInt.customId === 'imposters_submit_word' &&
                modalInt.user.id === wordButton.user.id
            });

            if (!submitted) {
              return wordButton.followUp({
                content: 'You did not submit the modal in time.',
                ephemeral: true
              });
            }
            const word = submitted.fields.getTextInputValue('word');

            Words.find((a) => a.id == wordButton.user.id)!.word = word;

            await submitted.reply({
              content: 'Your word has been submitted!',
              ephemeral: true
            });

            WriteEmbed.setFields([
              {
                name: 'Waiting for..',
                value: `<:fh_dotred:1182370172925915156>${Words.filter(
                  (a) => a.word.length == 0
                )
                  .map((a) => `<@${a.id}>`)
                  .join('\n<:fh_dotred:1182370172925915156>')}`,
                inline: true
              },
              {
                name: 'Submitted',
                value: `<:fh_dotgreen:1176188796249854052>${Words.filter(
                  (a) => a.word.length != 0
                )
                  .map((a) => `<@${a.id}>: ${a.word}`)
                  .join('\n<:fh_dotgreen:1176188796249854052>')}`,
                inline: true
              }
            ]);
            await WriteMessage.edit({
              embeds: [WriteEmbed]
            });
          });

          WordCollector.on('end', () => {
            (message.channel as TextChannel).send({
              embeds: [
                {
                  title: "Time's up!",
                  color: Colors.Red
                }
              ]
            });
            const EveryonesEmbed = new EmbedBuilder()
              .setTitle(`Round ${round} words`)
              .setDescription(`The theme was (i havent added this yet xdd)`)
              .addFields(
                Words.map((a) => {
                  return {
                    name: `<@${a.id}>`,
                    value: a.word || 'No word submitted',
                    inline: true
                  };
                })
              )
              .setColor('Yellow')
              .setFooter({
                text: 'The channel will unlock in 10 seconds.'
              });
            // @ts-ignore
            message.channel.send({
              embeds: [EveryonesEmbed]
            });

            // Unlock channel
          });
        }
      });
    });
  }
};
