const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');
const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const antiBot = require('../../client/AntiBot');
const { parseAmount } = require('../../utils/validators');

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  cooldown: 5,

  async execute(message, args, client) {
    if (!(await antiBot.check(message))) return;

    if (message.channel.parentId === config.ids.restrictedCategory) {
      return message.react('❌');
    }

    const cdCheck = cooldowns.check(message.author.id, 'blackjack', 5);
    if (!cdCheck.allowed) return;

    let bet = parseAmount(args[0]);
    if (!bet) bet = 1;
    if (bet > 25000) {
      return message.reply('You cannot bet more than 25,000 coins!');
    }

    const balance = await CoinService.getBalance(message.author.id);
    if (balance < bet) {
      return message.reply('You do not have enough coins!');
    }

    try {
      await CoinService.removeCoins(message.author.id, bet);
    } catch {
      return message.reply('You do not have enough coins!');
    }

    cooldowns.lock(message.author.id);

    const deck = createDeck();
    shuffleDeck(deck);

    let playerHand = [drawCard(deck), drawCard(deck)];
    let botHand = [drawCard(deck), drawCard(deck)];

    const embed = new EmbedBuilder()
      .setTitle('Blackjack')
      .setColor('Yellow')
      .setFooter({ text: 'Gambling is good for your health!' })
      .addFields([
        {
          name: message.member.displayName,
          value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(playerHand)}`,
          inline: true
        },
        {
          name: 'Carbon',
          value: `Hand: ${formatHand(botHand, true)}\nScore: ${calculateScore(botHand, true)}+`,
          inline: true
        }
      ]);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('hit').setLabel('Hit'),
      new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('stand').setLabel('Stand')
    ]);

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({
      filter: (button) => {
        if (button.user.id !== message.author.id) {
          button.reply({
            ephemeral: true,
            embeds: [{ description: 'Start your own game using `fh blackjack`' }]
          });
          return false;
        }
        return true;
      },
      idle: 30_000
    });

    collector.on('end', () => {
      cooldowns.unlock(message.author.id);
    });

    collector.on('collect', async (button) => {
      const what = button.customId;

      if (what === 'hit') {
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
                value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(botHand)}`,
                inline: true
              }
            ])
            .setColor('Red');
          row.components.forEach((c) => c.setDisabled(true));
          button.deferUpdate();
          await msg.edit({
            embeds: [embed],
            components: [row],
            content: `You busted! You lost **${bet.toLocaleString()}** coins!`
          });
          cooldowns.unlock(message.author.id);
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
                value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(botHand)}`,
                inline: true
              }
            ])
            .setColor('Green');
          row.components.forEach((c) => c.setDisabled(true));
          button.deferUpdate();
          await msg.edit({
            embeds: [embed],
            components: [row],
            content: `The dealer busted, you won **${bet.toLocaleString()}** coins!`
          });
          await CoinService.addCoins(message.author.id, bet * 2);
          cooldowns.unlock(message.author.id);
          return;
        }
        button.deferUpdate();
        embed
          .setFields([
            {
              name: message.member.displayName,
              value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(playerHand)}`,
              inline: true
            },
            {
              name: 'Carbon',
              value: `Hand: ${formatHand(botHand, true)}\nScore: ${calculateScore(botHand, true)}+`,
              inline: true
            }
          ])
          .setColor('Yellow');
        await msg.edit({ embeds: [embed], components: [row] });
      } else {
        collector.stop();
        button.deferUpdate();
        cooldowns.unlock(message.author.id);

        const playersc = calculateScore(playerHand);
        let botsc = calculateScore(botHand);

        while (botsc < 17) {
          botHand.push(drawCard(deck));
          botsc = calculateScore(botHand);
        }

        let winMsg;
        if (botsc > 21) {
          winMsg = { msg: `The dealer busted! You won ${bet.toLocaleString()} coins!`, color: 'Green' };
        } else if (botsc === 21 && playersc === 21) {
          winMsg = { msg: "It's a tie!", color: 'Yellow' };
          await CoinService.addCoins(message.author.id, bet);
        } else if (botsc === 21) {
          winMsg = { msg: `The dealer had a Blackjack, you lost ${bet.toLocaleString()} coins!`, color: 'Red' };
        } else if (playersc === 21) {
          winMsg = { msg: `You had a Blackjack, you won ${bet.toLocaleString()} coins!`, color: 'Green' };
        } else if (playersc > botsc) {
          winMsg = { msg: `You won ${bet.toLocaleString()} coins!`, color: 'Green' };
        } else if (botsc > playersc) {
          winMsg = { msg: `You lost ${bet.toLocaleString()} coins!`, color: 'Red' };
        } else {
          winMsg = { msg: "It's a tie!", color: 'Yellow' };
          await CoinService.addCoins(message.author.id, bet);
        }

        embed
          .setFields([
            {
              name: message.member.displayName,
              value: `Hand: ${formatHand(playerHand)}\nScore: ${calculateScore(playerHand)}`,
              inline: true
            },
            {
              name: 'Carbon',
              value: `Hand: ${formatHand(botHand)}\nScore: ${calculateScore(botHand)}`,
              inline: true
            }
          ])
          .setColor(winMsg.color);

        if (winMsg.color === 'Green') {
          await CoinService.addCoins(message.author.id, bet * 2);
        }
        row.components.forEach((c) => c.setDisabled(true));
        await msg.edit({
          embeds: [embed],
          content: winMsg.msg,
          components: [row]
        });
      }
    });
  }
};

const createDeck = () => {
  const deck = [];
  const suits = ['♥', '♦', '♣', '♠'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
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
    if (card.value === 'A') score += 11;
    else if (['J', 'Q', 'K'].includes(card.value)) score += 10;
    else score += parseInt(card.value);
    return score;
  }
  let score = 0;
  let ace = false;
  for (const card of cards) {
    if (card.value === 'A') { ace = true; score += 11; }
    else if (['J', 'Q', 'K'].includes(card.value)) score += 10;
    else score += parseInt(card.value);
  }
  if (ace && score > 21) score -= 10;
  return score;
}

function formatHand(hand, bot) {
  if (bot) {
    return hand.map((a, ind) =>
      ind === 0
        ? `[\`${a.suit}${a.value}\`](https://discord.com/invite/fight "nuh uh")`
        : `[\`??\`](https://discord.com/invite/fight "nuh uh")`
    );
  }
  return hand.map((a) => `[\`${a.suit}${a.value}\`](https://discord.com/invite/fight "nuh uh")`).join(' ');
}
