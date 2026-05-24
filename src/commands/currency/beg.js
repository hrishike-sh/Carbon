const {
  Message,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const antiBot = require('../../client/AntiBot');

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

    message.reply({
      embeds: [
        {
          author: {
            icon_url: message.author.displayAvatarURL(),
            name: message.author.username
          },
          footer: { text: 'Get a job' },
          description: map[Math.floor(Math.random() * map.length)].replace(
            '{coins}',
            randomAmount
          )
        }
      ]
    });

    if (Math.random() < 0.05) {
      const balance = await CoinService.getBalance(userId);

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
          {
            description: `Hello ${message.author.tag}... Have you tried gambling?\n\nDo you want to coinflip **${balance}** coins?`,
            footer: { text: '5% Chance of event spawning. You have 5 SECONDS.' },
            author: {
              icon_url: 'https://imgcdn.stablediffusionweb.com/2024/4/11/e3ee8859-cd4e-450a-a6b0-13ea78be5f4e.jpg',
              name: 'Casino Owner'
            }
          }
        ],
        components: [row]
      });

      const coll = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 5000
      });

      coll.on('collect', async (button) => {
        coll.stop();

        if (button.customId === 'yes') {
          const currentBalance = await CoinService.getBalance(userId);
          const won = Math.random() < 0.5;

          if (won) {
            await CoinService.addCoins(userId, currentBalance);
            message.channel.send({
              content: message.author.toString(),
              embeds: [
                {
                  title: 'Coinflip!',
                  color: Colors.Green,
                  description: `You won **${currentBalance.toLocaleString()}** coins!`,
                  footer: { text: 'This is why you should gamble!' }
                }
              ]
            });
          } else {
            try {
              await CoinService.removeCoins(userId, currentBalance);
            } catch {}
            message.channel.send({
              content: message.author.toString(),
              embeds: [
                {
                  title: 'Coinflip!',
                  color: Colors.Red,
                  description: `You lost **${currentBalance.toLocaleString()}** coins.`,
                  footer: { text: "This is why you shouldn't gamble." }
                }
              ]
            });
          }
        }
      });

      coll.on('end', () => {
        row.components.forEach((c) => c.setDisabled(true));
        msg.edit({ components: [row] });
      });
    }
  }
};
