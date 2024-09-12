const { Message, Client, EmbedBuilder } = require('discord.js');

module.exports = {
  name: '2playerblackjack',
  aliases: ['2bj', 'tbj', 'tpbj'],
  description: '2 player blackjack',
  /**
   *
   * @param {Message} message msg
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target = message.mentions.members?.first() || null;
    if (!target) return message.reply('You have to mention someone!');

    // Initialise & shuffle deck
    const deck = createDeck();
    shuffleDeck(deck);

    const hands = {
      player: [drawCard(deck), drawCard(deck)],
      opponent: [drawCard(deck), drawCard(deck)]
    };

    const embed = new EmbedBuilder()
      .setTitle('Blackjack')
      .setColor('Yellow')
      .setFooter({
        text: `${message.author.username} vs ${target.user.username}`
      })
      .setFields([
        {
          name: `${message.author.username}`,
          value: `Hand: ${formatHand(
            hands.player,
            true
          )}\nScore: ${calculateScore(hands.player, true)}`,
          inline: true
        },
        {
          name: `${target.user.username}`,
          value: `Hand: ${formatHand(
            hands.opponent,
            true
          )}\nScore: ${calculateScore(hands.opponent, true)}`,
          inline: true
        }
      ]);

    message.reply({ embeds: [embed] });
  }
};

// Functions

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
