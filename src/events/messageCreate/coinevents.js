const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const Coin = require('../../database/models/coins');
const { sleep } = require('../../utils/helpers');
const { warningEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const { generateMathQuestion, isCorrectMathAnswer } = require('../../utils/mathGame');
const logger = require('../../utils/logger');
const { onAsync } = require('../../utils/asyncEvents');

const channelCooldowns = new Set();

module.exports = {
  name: 'coinevents',

  async execute(message, client) {
    if (message.guild?.id !== config.ids.guildId) return;
    if (!message.channel?.id) return;

    const restrictedChannels = [config.ids.channels.modChat, config.ids.channels.fightAds];
    if (restrictedChannels.includes(message.channel.id)) return;
    if (channelCooldowns.has(message.channel.id)) return;
    if (Math.random() > 0.03) return;

    const channelId = message.channel.id;
    channelCooldowns.add(channelId);
    setTimeout(() => channelCooldowns.delete(channelId), 1000 * 60 * 10).unref();

    client.state.counts.coinEventsTriggered++;

    const randomEvent = ['heist', 'math'][Math.floor(Math.random() * 2)];

    if (randomEvent === 'heist') {
      client.state.counts.heistsTriggered++;
      await runHeist(message);
    } else {
      client.state.counts.mathEventsTriggered++;
      await runMathEvent(message);
    }
  }
};

async function runHeist(message) {
  const joined = new Set();
  const row = new ActionRowBuilder().addComponents([
    new ButtonBuilder()
      .setLabel('JOIN HEIST')
      .setCustomId('ce_jh')
      .setStyle(ButtonStyle.Success)
  ]);

  const mm = await message.channel.send({
    embeds: [
      warningEmbed({
        title: "We're Heisting Dauntless' Bank",
        description: 'Click the `JOIN HEIST` button to join!\n\nAt your own risk — you may lose coins.',
        footer: '25% chance to lose.'
      })
    ],
    components: [row]
  });

  const collector = mm.createMessageComponentCollector({
    filter: (button) => button.customId === 'ce_jh',
    idle: 10_000,
    time: 60_000
  });

  onAsync(collector, 'collect', async (button) => {
    if (joined.has(button.user.id)) {
      return button.reply({ flags: 64, content: "You've already joined the heist." });
    }
    joined.add(button.user.id);
    return button.reply({ flags: 64, content: "You've joined the heist, good luck!" });
  });

  collector.once('end', () => mm.edit({ components: [] }).catch(() => {}));
  onAsync(collector, 'end', async () => {
    if (joined.size < 1) {
      const msg = await message.channel.send('The heist failed!');
      await sleep(2500);
      msg.delete().catch(() => {});
      mm.delete().catch(() => {});
      return;
    }

    const pool = joined.size * (Math.floor(Math.random() * 100) + 300);
    const failed = [];
    const won = [];

    for (const userId of joined) {
      if (Math.random() < 0.25) {
        failed.push(userId);
        // Compute the percentage in MongoDB against the current balance so
        // concurrent spending cannot turn a stale loss into a negative balance.
        await Coin.updateOne(
          { userId },
          [{ $set: { coins: { $subtract: [
            { $max: [{ $ifNull: ['$coins', 0] }, 0] },
            { $floor: { $divide: [{ $max: [{ $ifNull: ['$coins', 0] }, 0] }, 10] } }
          ] } } }],
          { updatePipeline: true }
        );
      } else {
        won.push(userId);
      }
    }

    const winAmount = won.length > 0 ? Math.floor(pool / won.length) : 0;
    for (const userId of won) {
      await CoinService.addCoins(userId, winAmount);
    }

    const tokenEmoji = config.ids.emojis.token;

    const m = await message.channel.send({
      embeds: [
        successEmbed({
          title: 'Heist Winners',
          description:
            (won.map((a) => `<@${a}>`).join(' ').slice(0, 3500) || 'Nobody') +
            ` have won <:token:${tokenEmoji}> **${winAmount.toLocaleString()}** coins each!`
        }),
        errorEmbed({
          title: 'Heist Losers',
          description:
            (failed.map((a) => `<@${a}>`).join(' ').slice(0, 1500) || 'Nobody') +
            ' have lost **10% of their coins**',
          timestamp: true
        })
      ]
    });

    await sleep(2500);
    mm.delete().catch(() => {});
    m.delete().catch(() => {});
  });
}

async function runMathEvent(message) {
  const { expression, answer } = generateMathQuestion();
  const tokenEmoji = config.ids.emojis.token;
  const duration = 30_000;

  const m = await message.channel.send({
    embeds: [
      warningEmbed({
        title: 'Math Test',
        description: `What's **${expression}**?`,
        footer: 'First to answer within 30 seconds wins 101–200 coins!'
      })
    ]
  });

  const col = message.channel.createMessageCollector({
    filter: (msg) => !msg.author.bot && isCorrectMathAnswer(msg.content, answer),
    time: duration
  });

  // `once` plus stopping immediately prevents near-simultaneous answers from
  // receiving more than one payout while the database update is in flight.
  col.once('collect', (msg) => {
    col.stop('answered');

    (async () => {
      const coins = Math.floor(Math.random() * 100) + 101;
      await CoinService.addCoins(msg.author.id, coins);

      const reply = await message.channel.send(
        `${msg.author.toString()} was the first to answer! They got <:token:${tokenEmoji}> **${coins}** coins!`
      );

      setTimeout(() => {
        m.delete().catch(() => {});
        reply.delete().catch(() => {});
      }, 5000).unref();
    })().catch((err) => {
      logger.error('Failed to award math event winner', err);
      message.channel.send({
        embeds: [errorEmbed({ description: 'The answer was correct, but I could not award the coins.' })]
      }).catch(() => {});
    });
  });

  col.once('end', (_, reason) => {
    if (reason !== 'time') return;

    m.edit({
      embeds: [
        errorEmbed({
          title: 'Math Test — Time\'s Up!',
          description: `The answer to **${expression}** was **${answer}**.`
        })
      ]
    }).catch(() => {});

    setTimeout(() => m.delete().catch(() => {}), 5000).unref();
  });
}
