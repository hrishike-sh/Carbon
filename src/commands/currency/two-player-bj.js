const {
  Message,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponseType
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

    const decks = [
      {
        type: 'player',
        id: message.author.id,
        deck: [drawCard(deck), drawCard(deck)]
      },
      {
        type: 'target',
        id: target.id,
        deck: [drawCard(deck), drawCard(deck)]
      }
    ];

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
            decks[0].deck,
            true
          )}\nScore: ${calculateScore(decks[0].deck, true)}`,
          inline: true
        },
        {
          name: target.displayName,
          value: `Hand: ${formatHand(
            decks[1].deck,
            true
          )}\nScore: ${calculateScore(decks[1].deck, true)}`,
          inline: true
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

    collector.on('collect', async (btn) => {
      const handEmbed = new EmbedBuilder()
        .setTitle(`<:bj:1260496579941503016> Blackjack | Your Hand`)
        .setColor('Yellow')
        .setFooter({
          text: 'This is your hand.'
        });
      const gameRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId('hit_bj')
          .setLabel('Hit')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('stand_bj')
          .setLabel('Stand')
          .setStyle(ButtonStyle.Success)
      ]);

      if (btn.user.id === message.author.id) {
        handEmbed.addFields([
          {
            name: message.author.displayName,
            value: `Hand: ${formatHand(
              decks[0].deck,
              false
            )}\nScore: ${calculateScore(decks[0].deck, false)}`
          }
        ]);
      } else {
        handEmbed.addFields([
          {
            name: target.displayName,
            value: `Hand: ${formatHand(
              decks[1].deck,
              false
            )}\nScore: ${calculateScore(decks[1].deck, false)}`
          }
        ]);
      }

      const epmessage = await btn.reply({
        embeds: [handEmbed],
        components: [gameRow],
        ephemeral: true,
        fetchReply: true
      });
      const gameCol = epmessage.createMessageComponentCollector({
        filter: (m) => [message.author.id, target.id].includes(m.user.id),
        componentType: ComponentType.Button
      });
      const gameDat = {
        stood: []
      };
      gameCol.on('collect', async (button) => {
        console.log(button.customId);
        if (button.customId === 'hit_bj') {
          decks.find((a) => a.id == button.user.id).deck.push(drawCard(deck));
          handEmbed.setFields({
            name: button.user.displayName,
            value: `Hand: ${formatHand(
              decks.find((a) => a.id == button.user.id).deck,
              false
            )}\nScore: ${calculateScore(
              decks.find((a) => a.id == button.user.id).deck,
              false
            )}`
          });
          await button.deferUpdate();
          await btn.followUp({
            embeds: [handEmbed],
            components: [gameRow],
            ephemeral: true
          });
        } else {
        }
      });
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
