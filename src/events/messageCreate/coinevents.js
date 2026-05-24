const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const { sleep } = require('../../utils/helpers');

const channelCooldowns = [];

module.exports = {
  name: 'coinevents',

  async execute(message) {
    if (message.guild.id !== config.ids.guildId) return;

    const restrictedChannels = [config.ids.channels.modChat, config.ids.channels.fightAds];
    if (restrictedChannels.includes(message.channel.id)) return;
    if (channelCooldowns.includes(message.channel.id)) return;
    if (Math.random() > 0.03) return;

    channelCooldowns.push(message.channel.id);
    setTimeout(() => {
      channelCooldowns.splice(channelCooldowns.indexOf(message.channel.id), 1);
    }, 1000 * 60 * 10);

    const randomEvent = ['heist', 'math'][Math.floor(Math.random() * 2)];

    if (randomEvent === 'heist') {
      await runHeist(message);
    } else {
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
      {
        title: "WE'RE HEISTING DAUNTLESS' BANK",
        description: 'Click the `JOIN HEIST` button to join!\n\nAt your own risk tho, you may lose coins.',
        color: Colors.Yellow,
        footer: { text: '25% chance to lose.' }
      }
    ],
    components: [row]
  });

  const collector = mm.createMessageComponentCollector({ idle: 10_000 });

  collector.on('collect', async (button) => {
    if (joined.includes(button.user.id)) {
      return button.reply({ ephemeral: true, content: "You've already joined the heist." });
    }
    joined.push(button.user.id);
    return button.reply({ ephemeral: true, content: "You've joined the heist, good luck!" });
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
        {
          title: 'Heist Winners',
          color: Colors.Green,
          description:
            won.map((a) => `<@${a}>`).join(' ') +
            ` have won <:token:${tokenEmoji}> **${winAmount.toLocaleString()}** coins each!`
        },
        {
          title: 'Heist Losers',
          color: Colors.Red,
          description:
            failed.map((a) => `<@${a}>`).join(' ') +
            ' have lost **10% of their coins** :joy_cat:',
          timestamp: new Date()
        }
      ]
    });

    await sleep(2500);
    mm.delete().catch(() => {});
    m.delete().catch(() => {});
  });
}

async function runMathEvent(message) {
  const num1 = Math.floor(Math.random() * 500);
  const num2 = Math.floor(Math.random() * 500);
  const tokenEmoji = config.ids.emojis.token;

  const m = await message.channel.send({
    embeds: [
      {
        title: 'Math Test :nerd:',
        color: Colors.Yellow,
        description: `What's **${num1}+${num2}**?`,
        footer: { text: 'First to answer gets a random amount of coins!' }
      }
    ]
  });

  const col = message.channel.createMessageCollector({
    filter: (msg) => msg.content == num1 + num2
  });

  col.on('collect', async (msg) => {
    const coins = Math.ceil(Math.random() * 100) + 100;
    await Coin.findOneAndUpdate(
      { userId: msg.author.id },
      { $inc: { coins } },
      { upsert: true }
    );
    col.stop();

    const reply = await message.channel.send(
      `:nerd: ${msg.author.toString()} :nerd: was the first to answer! They got <:token:${tokenEmoji}> **${coins}** coins!`
    );
    await sleep(2500);
    m.delete().catch(() => {});
    reply.delete().catch(() => {});
  });
}

const Coin = require('../../database/models/coins');
