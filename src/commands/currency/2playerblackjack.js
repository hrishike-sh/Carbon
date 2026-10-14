const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { Theme } = require('../../utils/embeds');
const { createDeck, shuffleDeck, drawCard, calculateScore, formatHand } = require('./lib/blackjack');
const { onAsync } = require('../../utils/asyncEvents');

module.exports = {
  name: '2playerblackjack',
  aliases: ['2bj'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply(
        'Either mention someone to play with or use `fh bj`'
      );
    }
    if (target.id === message.author.id) {
      return message.reply("You can't play against yourself!");
    }
    if (target.bot) {
      return message.reply("You can't play against a bot!");
    }

    const acceptEmbed = new EmbedBuilder()
      .setTitle('Blackjack Challenge')
      .setDescription(
        `${target.username}, ${message.author.username} has challenged you to a game of blackjack. Do you accept?`
      )
      .setColor(Theme.warning);

    const acceptRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_bj')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('decline_bj')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
    );

    const acceptMessage = await message.channel.send({
      content: `${target.toString()}`,
      embeds: [acceptEmbed],
      components: [acceptRow]
    });

    const collector = acceptMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === target.id,
      time: 60000,
      max: 1
    });

    onAsync(collector, 'end', async (collected) => {
      if (collected.size === 0) {
        await acceptMessage.edit({ content: 'The challenge has expired.', embeds: [], components: [] });
      }
    }, 'Two-player blackjack invitation');

    onAsync(collector, 'collect', async (interaction) => {
      if (interaction.customId === 'decline_bj') {
        return interaction.update({
          content: 'The challenge has been declined.',
          embeds: [],
          components: []
        });
      }

      const deck = createDeck();
      shuffleDeck(deck);

      const hands = {
        [message.author.id]: {
          user: message.author,
          hand: [drawCard(deck), drawCard(deck)],
          stood: false,
          busted: false
        },
        [target.id]: {
          user: target,
          hand: [drawCard(deck), drawCard(deck)],
          stood: false,
          busted: false
        }
      };

      const gameEmbed = new EmbedBuilder()
        .setTitle('Blackjack')
        .setColor(Theme.warning)
        .setDescription(
          'The game has started! Click "Show Hand" to see your cards and play.'
        )
        .addFields(
          {
            name: message.author.username,
            value: 'Status: Playing',
            inline: true
          },
          {
            name: target.username,
            value: 'Status: Playing',
            inline: true
          }
        );

      const gameRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('show_hand_bj')
          .setLabel('Show Hand')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({
        embeds: [gameEmbed],
        components: [gameRow]
      });

      const gameCollector = acceptMessage.createMessageComponentCollector({
        filter: (i) => [message.author.id, target.id].includes(i.user.id),
        time: 180000
      });
      let gameOver = false;
      let pendingEdit = Promise.resolve();
      const handCollectors = new Set();
      const editGame = (payload) => {
        pendingEdit = pendingEdit.catch(() => {}).then(() => acceptMessage.edit(payload));
        return pendingEdit;
      };

      onAsync(gameCollector, 'end', async (_, reason) => {
        gameOver = true;
        for (const handCollector of handCollectors) handCollector.stop();
        if (reason !== 'completed') {
          await editGame({ content: 'The game has expired.', components: [] });
        }
      }, 'Two-player blackjack expiry');

      onAsync(gameCollector, 'collect', async (i) => {
        if (i.customId === 'show_hand_bj') {
          const userState = hands[i.user.id];
          if (gameOver || userState.stood || userState.busted) {
            return i.reply({
              content: 'You have already finished your turn.',
              flags: 64
            });
          }

          const handEmbed = new EmbedBuilder()
            .setTitle('Your Hand')
            .setDescription(
              `Your hand is: ${formatHand(
                userState.hand
              )}\nYour score is: ${calculateScore(userState.hand)}`
            )
            .setColor(Theme.info);

          const handRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('hit_bj')
              .setLabel('Hit')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('stand_bj')
              .setLabel('Stand')
              .setStyle(ButtonStyle.Secondary)
          );

          const ephemeralMessage = await i.reply({
            embeds: [handEmbed],
            components: [handRow],
            flags: 64,
            fetchReply: true
          });
          if (gameOver) {
            await ephemeralMessage.edit({ components: [] });
            return;
          }

          const ephemeralCollector =
            ephemeralMessage.createMessageComponentCollector({
              filter: (buttonInteraction) =>
                buttonInteraction.user.id === i.user.id,
              time: 60000
            });
          handCollectors.add(ephemeralCollector);
          onAsync(ephemeralCollector, 'end', async () => {
            handCollectors.delete(ephemeralCollector);
            await ephemeralMessage.edit({ components: [] });
          }, 'Two-player blackjack hand expiry');

          onAsync(ephemeralCollector, 'collect', async (buttonInteraction) => {
            if (gameOver || userState.stood || userState.busted) {
              await buttonInteraction.update({ components: [] });
              return;
            }

            if (buttonInteraction.customId === 'hit_bj') {
              userState.hand.push(drawCard(deck));
              const score = calculateScore(userState.hand);
              if (score >= 21) {
                userState.stood = true;
                if (score > 21) userState.busted = true;
              }
            } else if (buttonInteraction.customId === 'stand_bj') {
              userState.stood = true;
            }

            const updatedHandEmbed = new EmbedBuilder()
              .setTitle('Your Hand')
              .setDescription(
                `Your hand is: ${formatHand(
                  userState.hand
                )}\nYour score is: ${calculateScore(userState.hand)}`
              )
              .setColor(userState.busted ? Theme.error : Theme.info);

            await buttonInteraction.update({
              embeds: [updatedHandEmbed],
              components: userState.stood ? [] : [handRow]
            });

            if (userState.stood) {
              ephemeralCollector.stop();
            }

            await updateMainEmbed();
            await checkWinCondition();
          }, 'Two-player blackjack hand');
        }
      }, 'Two-player blackjack game');

      async function updateMainEmbed() {
        if (gameOver) return;
        const fields = Object.values(hands).map((playerState) => {
          let status = 'Playing';
          if (playerState.busted) status = 'Busted!';
          else if (playerState.stood) status = 'Stood';
          return {
            name: playerState.user.username,
            value: `Status: ${status}`,
            inline: true
          };
        });

        const updatedGameEmbed = new EmbedBuilder()
          .setTitle('Blackjack')
          .setColor(Theme.warning)
          .setDescription('The game is in progress...')
          .setFields(fields);

        await editGame({ embeds: [updatedGameEmbed] });
      }

      async function checkWinCondition() {
        if (gameOver) return;
        const player1State = hands[message.author.id];
        const player2State = hands[target.id];

        if (player1State.stood && player2State.stood) {
          gameOver = true;
          gameCollector.stop('completed');
          const score1 = calculateScore(player1State.hand);
          const score2 = calculateScore(player2State.hand);

          let winner = null;
          let reason = '';
          let color = Theme.warning;

          if (score1 > 21 && score2 > 21) {
            reason = 'Both players busted! It a tie!';
          } else if (score1 > 21) {
            winner = target;
            reason = `${message.author.username} busted!`;
            color = Theme.error;
          } else if (score2 > 21) {
            winner = message.author;
            reason = `${target.username} busted!`;
            color = Theme.success;
          } else if (score1 > score2) {
            winner = message.author;
            reason = `${message.author.username} has a higher score!`;
            color = Theme.success;
          } else if (score2 > score1) {
            winner = target;
            reason = `${target.username} has a higher score!`;
            color = Theme.error;
          } else {
            reason = "It's a tie!";
          }

          const resultEmbed = new EmbedBuilder()
            .setTitle('Blackjack - Game Over')
            .setDescription(reason)
            .setColor(color)
            .addFields(
              {
                name: `${message.author.username}'s Hand`,
                value: `${formatHand(player1State.hand)}\nScore: ${score1}`,
                inline: true
              },
              {
                name: `${target.username}'s Hand`,
                value: `${formatHand(player2State.hand)}\nScore: ${score2}`,
                inline: true
              }
            );

          if (winner) {
            resultEmbed.addFields({
              name: 'Winner',
              value: `${winner.username} won!`
            });
          }

          await editGame({
            embeds: [resultEmbed],
            components: []
          });
        }
      }

    }, 'Two-player blackjack challenge');
  }
};
