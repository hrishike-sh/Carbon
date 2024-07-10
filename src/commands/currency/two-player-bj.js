const {
  Message,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: '2bj',
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

    const deck = createDeck();
    shuffleDeck(deck);

    let playerHand = [drawCard(deck), drawCard(deck)];
    let targetHand = [drawCard(deck), drawCard(deck)];

    const embed = new EmbedBuilder()
      .setTitle('<:bj:1260496579941503016> Blackjack')
      .setColor('Yellow')
      .setFooter({
        text: 'Click on the button to see your hand.'
      })
      .addFields([
        {
          name: message.author.displayName,
          value: `Hand: ${formatHand(
            playerHand,
            true
          )}\nScore: ${calculateScore(playerHand, true)}`
        },
        {
          name: target.displayName,
          value: `Hand: ${formatHand(
            targetHand,
            true
          )}\nScore: ${calculateScore(targetHand, true)}`
        }
      ]);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId('show_hand_bj')
        .setStyle(ButtonStyle.Success)
        .setLabel('Show Hand')
    ]);

    const startMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });
    const collector = startMessage.createMessageComponentCollector({
      filter: (m) => [message.author.id, target.id].includes(m.user.id)
    });

    collector.on('collect', (btn) => {
      const handEmbed = new EmbedBuilder()
        .setTitle(`<:bj:1260496579941503016> Blackjack | Your Hand`)
        .setColor('Yellow')
        .setFooter({
          text: 'This is your hand.'
        });
      if (btn.user.id === message.author.id) {
        handEmbed.addFields([
          {
            name: message.author.displayName,
            value: `Hand: ${formatHand(
              playerHand,
              false
            )}\nScore: ${calculateScore(playerHand, false)}`
          }
        ]);
      } else {
        handEmbed.addFields([
          {
            name: target.displayName,
            value: `Hand: ${formatHand(
              targetHand,
              false
            )}\nScore: ${calculateScore(targetHand, false)}`
          }
        ]);
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
