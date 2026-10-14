const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');
const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const antiBot = require('../../client/AntiBot');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const logger = require('../../utils/logger');

const map = [
  'Hrish gave you {coins} coins for your left kidney!',
  'Begging? Try sex work instead! Hrish gave you {coins} coins and advice.',
  'Mirror gave you {coins} coins for admiring her beauty.',
  "Mirror's cat paid you {coins} coins to turn on the AC.",
  'Mirror gave you {coins} coins to watch KDramas with her!',
  'You caught spaghet touching grass, they paid you {coins} coins to shut the fuck up.',
  "You got paid {coins} coins to not tell anyone that Inter used you for an assessment because he can't type.",
  'You walked into steph and spaghet doing the devils tango, they paid you {coins} coins to get the hell out.',
  'You caught steph self reflecting in the bath tub, she paid you {coins} coins to leave her alone.',
  'You walked in on steph doing her makeup, she paid you {coins} coins to not tell anyone her beauty secrets.',
  'Akshay paid you {coins} coins to debug his code.',
  "Mirror's cat brought you {coins} coins, clearly preferring you over Mirror.",
  'You catch steph drinking at a bar instead of moderating. She paid you {coins} coins to let her get some damn rest',
  'Akshay gave you {coins} coins to not talk about his browser history.',
  '```py\n"You find glitch in a computer program, he gives you {coins} to run the code!"\n```',
  "You walked in on Akshay with his 'VR headset' on and he paid you {coins} coins to keep it quiet. ",
  "You found Akshay's stash of 'adult' magazines and he paid you {coins} coins to keep it a secret.",
  'Riyah gave you {coins} coins to stop donating for events.',
  "Sexcey gave you {coins} coins to not talk about the war crimes he's committed.",
  'Tee gave you {coins} coins to buy her food',
  'Sunshine gives you {coins} coins to stop the rain.',
  "You walked up to Gen taking his meds, here's {coins} coins to keep it a secret",
  'Apple gave you {coins} coins to spend on Valorant.',
  'Apple gave you {coins} coins to annoy Tee.',
  'Ali paid you {coins} coins to stop looking for his uncle, who has been missing since 2001.'
];

module.exports = {
  name: 'beg',
  aliases: ['pleasegivemecoins'],
  cooldown: 7.5,
  antiBot: true,
  description: 'beg u brokeass',

  async execute(message, args, client) {
    if (message.channel.parentId === config.ids.restrictedCategory) {
      return message.react('❌');
    }
    if (config.ids.restrictedCurrencyChannels.includes(message.channel.id)) {
      return message.react('❌');
    }
    if (!(await antiBot.check(message))) return;

    const userId = message.author.id;
    const randomAmount = Math.ceil(Math.random() * 75) + 50;
    await CoinService.addCoins(userId, randomAmount);

    await message.reply({
      embeds: [
        successEmbed({
          author: {
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
          },
          description: map[Math.floor(Math.random() * map.length)].replace(
            '{coins}',
            randomAmount.toString()
          ),
          footer: 'Get a job'
        })
      ]
    });

    if (Math.random() < 0.05) {
      const balance = await CoinService.getBalance(userId);
      if (balance <= 0 || !Number.isSafeInteger(balance * 2)) return;

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId('yes')
          .setStyle(ButtonStyle.Success)
          .setLabel('YES'),
        new ButtonBuilder()
          .setCustomId('no')
          .setStyle(ButtonStyle.Danger)
          .setLabel('NO')
      ]);

      const msg = await message.reply({
        embeds: [
          successEmbed({
            description: `Hello ${message.author.tag}... Have you tried gambling?\n\nDo you want to coinflip **${balance}** coins?`,
            footer: '5% Chance of event spawning. You have 5 SECONDS.',
            author: {
              name: 'Casino Owner',
              iconURL: 'https://imgcdn.stablediffusionweb.com/2024/4/11/e3ee8859-cd4e-450a-a6b0-13ea78be5f4e.jpg'
            }
          })
        ],
        components: [row]
      });

      const coll = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 5000
      });

      coll.once('collect', (button) => {
        coll.stop();
        (async () => {
          if (button.customId !== 'yes') return button.deferUpdate();
          if (!cooldowns.lock(userId)) {
            return button.reply({ content: "You're already running a command!", flags: 64 });
          }
          try {
            await button.deferUpdate();
            // Stake the amount displayed in the invitation before deciding
            // the result. A concurrent debit must not yield a free gamble.
            try {
              await CoinService.removeCoins(userId, balance);
            } catch (err) {
              if (err instanceof InsufficientFundsError) {
                await button.followUp({ content: 'You no longer have enough coins for this bet.', flags: 64 });
                return;
              }
              throw err;
            }
            const won = Math.random() < 0.5;
            if (won) await CoinService.addCoins(userId, balance * 2);
            await message.channel.send({
              content: message.author.toString(),
              embeds: [
                (won ? successEmbed : errorEmbed)({
                  title: 'Coinflip!',
                  description: `You ${won ? 'won' : 'lost'} **${balance.toLocaleString()}** coins!`,
                  footer: won ? 'This is why you should gamble!' : "This is why you shouldn't gamble."
                })
              ]
            });
          } finally {
            cooldowns.unlock(userId);
          }
        })().catch((err) => logger.error('Beg coinflip failed', err));
      });

      coll.once('end', () => {
        row.components.forEach((c) => c.setDisabled(true));
        msg.edit({ components: [row] }).catch((err) => logger.error('Failed to close beg coinflip', err));
      });
    }
  }
};
