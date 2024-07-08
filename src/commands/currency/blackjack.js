const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/coins');
let cd = [];
module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!(await client.antiBot(message))) return;

    if (cd.includes(message.author.id)) {
      return message.reply(
        'Please wait 10 seconds before using this command again'
      );
    }
    addCd(message.author.id);
    const deck = createDeck();
    shuffleDeck(deck);

    let playerHand = [drawCard(deck), drawCard(deck)];
    let botHand = [drawCard(deck), drawCard(deck)];

    const embed = new EmbedBuilder()
      .setTitle('Blackjack')
      .setColor('Yellow')
      .setFooter({
        text: 'Gambling is good for your health!'
      })
      .addFields([
        {
          name: message.member.displayName,
          value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(
            playerHand
          )}`,
          inline: true
        },
        {
          name: 'Carbon',
          value: `Hand: ${formatHand(botHand, true)}\nScore: ${calculateScore(
            botHand,
            true
          )}+`,
          inline: true
        }
      ]);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId('hit')
        .setLabel('Hit'),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId('stand')
        .setLabel('Stand')
    ]);

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({
      filter: (button) => {
        if (button.user.id !== message.author.id) {
          button.reply({
            ephemeral: true,
            embeds: [
              {
                description: `Start your own game using \`fh blackjack\``
              }
            ]
          });
          return false;
        } else return true;
      },
      idle: 30_000
    });

    collector.on('collect', async (button) => {
      const what = button.customId;

      if (what == 'hit') {
        playerHand.push(drawCard(deck));
        const playerScore = calculateScore(playerHand);

        if (playerScore > 21) {
          collector.stop();
          embed
            .setFields([
              {
                name: message.member.displayName,
                value: `Hand: ${formatHand(playerHand)}\nScore: ${playerScore}`,
                inline: true
              },
              {
                name: 'Carbon',
                value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(
                  botHand
                )}`,
                inline: true
              }
            ])
            .setColor('Red');
          row.components[0].setDisabled(true);
          row.components[1].setDisabled(true);
          button.deferUpdate();
          await msg.edit({
            embeds: [embed],
            components: [row],
            content: 'You busted!'
          });
          return;
        }

        let botScore = calculateScore(botHand);
        if (botScore < 17) {
          botHand.push(drawCard(deck));
          botScore = calculateScore(botHand);
        }

        if (botScore > 21) {
          collector.stop();
          embed
            .setFields([
              {
                name: message.member.displayName,
                value: `Hand: ${formatHand(playerHand)}\nScore: ${playerScore}`,
                inline: true
              },
              {
                name: 'Carbon',
                value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(
                  botHand
                )}`,
                inline: true
              }
            ])
            .setColor('Green');
          row.components[0].setDisabled(true);
          row.components[1].setDisabled(true);
          button.deferUpdate();
          await msg.edit({
            embeds: [embed],
            components: [row],
            content: 'The dealer busted, you win!'
          });

          await Database.findOneAndUpdate(
            { userId: message.author.id },
            {
              $inc: {
                coins: Math.floor(Math.random() * 25) + 75
              }
            }
          );
          return;
        }
        button.deferUpdate();
        embed
          .setFields([
            {
              name: message.member.displayName,
              value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(
                playerHand
              )}`,
              inline: true
            },
            {
              name: 'Carbon',
              value: `Hand: ${formatHand(
                botHand,
                true
              )}\nScore: ${calculateScore(botHand, true)}+`,
              inline: true
            }
          ])
          .setColor('Yellow');
        await msg.edit({
          embeds: [embed],
          components: [row]
        });
      } else {
        collector.stop();
        button.deferUpdate();
        let winMsg = null;
        const playersc = calculateScore(playerHand);
        let botsc = calculateScore(botHand);

        while (botsc < 17) {
          botHand.push(drawCard(deck));
          botsc = calculateScore(botHand);
        }

        if (botsc > 21) {
          winMsg = {
            msg: 'The dealer busted, you win!',
            color: 'Green'
          };
        } else if (botsc == 21) {
          winMsg = {
            msg: 'The dealer had a Blackjack, you lose!',
            color: 'Red'
          };
        } else if (playersc == 21) {
          winMsg = {
            msg: 'You have a Blackjack, you win!',
            color: 'Green'
          };
        } else if (playersc > botsc) {
          winMsg = {
            msg: `You won! You had a higher score than the dealer.`,
            color: 'Green'
          };
        } else if (botsc > playersc) {
          winMsg = {
            msg: 'You lost! The dealer had a higher score than you.',
            color: 'Red'
          };
        } else {
          winMsg = {
            msg: 'Its a tie!',
            color: 'Yellow'
          };
        }

        embed
          .setFields([
            {
              name: message.member.displayName,
              value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(
                playerHand
              )}`,
              inline: true
            },
            {
              name: 'Carbon',
              value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(
                botHand
              )}`,
              inline: true
            }
          ])
          .setColor(winMsg.color);
        if (winMsg.color == 'Green') {
          const coins = Math.floor(Math.random() * 25) + 75;
          await Database.findOneAndUpdate(
            { userId: message.author.id },
            {
              $inc: {
                coins
              }
            }
          );
          embed.setFooter({
            text: `You won ${coins.toLocaleString()} coins!`
          });
        }
        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        await msg.edit({
          embeds: [embed],
          content: winMsg.msg,
          components: [row]
        });
        return;
      }
    });
  }
};

const createDeck = () => {
  const deck = [];
  const suits = ['♥', '♦', '♣', '♠'];
  const values = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A'
  ];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
};

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard(deck) {
  return deck.pop();
}

function calculateScore(cards, bot) {
  if (bot) {
    let score = 0;
    const card = cards[0];
    if (card.value === 'A') {
      score += 11;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
    return score;
  } else {
    let score = 0;
    let ace = false;

    for (const card of cards) {
      if (card.value === 'A') {
        ace = true;
        score += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }

    if (ace && score > 21) {
      score -= 10;
    }

    return score;
  }
}

function formatHand(hand, bot) {
  if (bot) {
    return hand.map(
      (a, ind) =>
        `${
          ind == 0
            ? `[\`${a.suit}${a.value}\`](https://discord.com/invite/fight "nuh uh")`
            : `[\`??\`](https://discord.com/invite/fight "nuh uh")`
        }`
    );
  } else {
    return hand
      .map(
        (a) =>
          `[\`${a.suit}${a.value}\`](https://discord.com/invite/fight "nuh uh")`
      )
      .join(' ');
  }
}
const addCd = async (userId) => {
  cd.push(userId);
  await sleep(10_000);
  cd = cd.filter((a) => a != userId);
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
