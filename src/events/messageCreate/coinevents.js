const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const { sleep } = require('../../utils/helpers');
const { warningEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const { generateMathQuestion, isCorrectMathAnswer } = require('../../utils/mathGame');
const logger = require('../../utils/logger');

const channelCooldowns = [];

module.exports = {
  name: 'coinevents',

  async execute(message, client) {
    if (message.guild?.id !== config.ids.guildId) return;
    if (!message.channel?.id) return;

    const restrictedChannels = [config.ids.channels.modChat, config.ids.channels.fightAds];
    if (restrictedChannels.includes(message.channel.id)) return;
    if (channelCooldowns.includes(message.channel.id)) return;
    if (Math.random() > 0.03) return;

    const channelId = message.channel.id;
    channelCooldowns.push(channelId);
    setTimeout(() => {
      const index = channelCooldowns.indexOf(channelId);
      if (index !== -1) channelCooldowns.splice(index, 1);
    }, 1000 * 60 * 10);

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
  const joined = [];
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

  const collector = mm.createMessageComponentCollector({ idle: 10_000 });

  collector.on('collect', async (button) => {
    if (joined.includes(button.user.id)) {
      return button.reply({ flags: 64, content: "You've already joined the heist." });
    }
    joined.push(button.user.id);
    return button.reply({ flags: 64, content: "You've joined the heist, good luck!" });
  });

  collector.on('end', async () => {
    if (joined.length < 1) {
      const msg = await message.channel.send('The heist failed!');
      await sleep(2500);
      msg.delete().catch(() => {});
      mm.delete().catch(() => {});
      return;
    }

    const pool = joined.length * (Math.floor(Math.random() * 100) + 300);
    const failed = [];
    const won = [];

    for (const userId of joined) {
      if (Math.random() < 0.25) {
        failed.push(userId);
        const user = await CoinService.getUser(userId);
        const loss = Math.floor((user.coins || 0) / 10);
        await Coin.findOneAndUpdate(
          { userId },
          { $inc: { coins: -loss } },
          { upsert: true }
        );
      } else {
        won.push(userId);
      }
    }

    const winAmount = won.length > 0 ? Math.floor(pool / won.length) : 0;
    for (const userId of won) {
      await Coin.findOneAndUpdate(
        { userId },
        { $inc: { coins: winAmount } },
        { upsert: true }
      );
    }

    const tokenEmoji = config.ids.emojis.token;

    const m = await message.channel.send({
      embeds: [
        successEmbed({
          title: 'Heist Winners',
          description:
            won.map((a) => `<@${a}>`).join(' ') +
            ` have won <:token:${tokenEmoji}> **${winAmount.toLocaleString()}** coins each!`
        }),
        errorEmbed({
          title: 'Heist Losers',
          description:
            failed.map((a) => `<@${a}>`).join(' ') +
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
      }, 5000);
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

    setTimeout(() => m.delete().catch(() => {}), 5000);
  });
}

const Coin = require('../../database/models/coins');
