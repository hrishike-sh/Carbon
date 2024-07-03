const { Message, Client, EmbedBuilder, Colors } = require('discord.js');

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
      .setColor(Colors.DarkGreen)
      .setFooter({
        text: 'Gambling is good for your health!'
      })
      .addFields([
        {
          name: 'Your Hand',
          value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(
            playerHand
          )}`
        },
        {
          name: "Carbon's Hand",
          value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(
            botHand
          )}`
        }
      ]);
    await message.channel.send({ embeds: [embed] });
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

function calculateScore(cards) {
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

function formatHand(hand) {
  return hand.map((a) => `\`${a.suit}${a.value}\``).join(' ');
}
