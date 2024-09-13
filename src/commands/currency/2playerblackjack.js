const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require('discord.js');

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
    const data = {
      player: {
        id: message.author.id,
        hand: [drawCard(deck), drawCard(deck)]
      },
      opponent: {
        id: target.id,
        hand: [drawCard(deck), drawCard(deck)]
      }
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
            data.player.hand,
            true
          )}\nScore: ${calculateScore(data.player.hand, true)}`,
          inline: true
        },
        {
          name: `${target.user.username}`,
          value: `Hand: ${formatHand(
            data.opponent.hand,
            true
          )}\nScore: ${calculateScore(data.opponent.hand, true)}`,
          inline: true
        }
      ]);
    const Row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bj_showhand')
        .setLabel('Show hand')
        .setStyle(ButtonStyle.Primary)
    );

    const GameMessage = await message.channel.send({
      embeds: [embed],
      components: [Row]
    });

    const ShowHandCollector = GameMessage.createMessageComponentCollector({
      idle: 120_000
    });

    ShowHandCollector.on('collect', async (ShowHandButton) => {
      if (![message.author.id, target.id].includes(ShowHandButton.user.id)) {
        return ShowHandButton.reply({
          content: 'This is not your game :bangbang:',
          ephemeral: true
        });
      }
      const InterfaceUser = ShowHandButton.user;
      const OpponentUser =
        InterfaceUser.id == data.player.id ? target : message.author;
      let InterfaceUserData, OpponentUserData;
      if (InterfaceUser.id == data.player.id) {
        InterfaceUserData = data.player;
        OpponentUserData = data.opponent;
      } else {
        InterfaceUserData = data.opponent;
        OpponentUserData = data.player;
      }
      const InterfaceEmbed = new EmbedBuilder()
        .setAuthor({
          name: InterfaceUser.username,
          iconURL: InterfaceUser.displayAvatarURL()
        })
        .setColor('Yellow')
        .setFooter({
          text: `${message.author.username} vs ${target.user.username}`
        })
        .setFields([
          {
            name: InterfaceUser.username,
            value: `Hand: ${formatHand(
              InterfaceUserData.hand,
              false
            )}\nScore: ${calculateScore(InterfaceUserData.hand, false)}`
          },
          {
            name: OpponentUser.user.username,
            value: `Hand: ${formatHand(
              OpponentUserData.hand,
              true
            )}\nScore: ${calculateScore(OpponentUserData.hand, true)}`
          }
        ]);
      const Row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId('bj_int_hit')
          .setStyle(ButtonStyle.Danger)
          .setLabel('HIT'),
        new ButtonBuilder()
          .setCustomId('bj_int_stand')
          .setStyle(ButtonStyle.Success)
          .setLabel('STAND')
      ]);
      const InterfaceMessage = await ShowHandButton.reply({
        ephemeral: true,
        embeds: [InterfaceEmbed],
        components: [Row]
      });

      const ActionCollector = InterfaceMessage.createMessageComponentCollector({
        idle: 15_000
      });

      ActionCollector.on('collect', async (ActionButton) => {
        const id = ActionButton.customId;
        console.log(id);
        if (id == 'bj_int_hit') {
          // HIT

          InterfaceUserData.hand.push(drawCard(deck));
          const playerScore = calculateScore(InterfaceUserData.hand, false);

          InterfaceEmbed.setFields([
            {
              name: InterfaceUser.username,
              value: `Hand: ${formatHand(
                InterfaceUserData.hand,
                false
              )}\nScore: ${calculateScore(InterfaceUserData.hand, false)}`
            },
            {
              name: OpponentUser.user.username,
              value: `Hand: ${formatHand(
                OpponentUserData.hand,
                true
              )}\nScore: ${calculateScore(OpponentUserData.hand, true)}`
            }
          ]);

          ActionButton.editReply({
            embeds: [InterfaceEmbed],
            components: [Row]
          });
        } else if (id == 'bj_int_stand') {
        } else;
      });
    });
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
