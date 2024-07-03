const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (message.author.id !== '598918643727990784') return;
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
          return true;
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