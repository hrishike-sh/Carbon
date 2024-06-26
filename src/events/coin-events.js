const {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} = require('discord.js');
const Database = require('../database/coins');
let cd = [];
module.exports = {
  name: 'messageCreate',
  /**
   * @param {Message} message
   */
  async execute(message) {
    if (message?.guild.id !== '824294231447044197' || message.author.bot) {
      // fh only & no bots
      return;
    }

    const restrictedChannels = ['881128829131841596', '824313123728261150']; // mod-chat and fight-ads

    if (restrictedChannels.includes(message.channel.id)) return;

    if (cd.includes(message.channel.id)) return; // return if there was an event in the channel recently
    if (Math.random() > 0.03) return; // 3% chance for event
    addCd(message.channel.id);

    const randomEvent = ['heist', 'math'][Math.floor(Math.random() * 2)];

    if (randomEvent == 'heist') {
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
            description:
              'Click the `JOIN HEIST` button to join!\n\nAt your own risk tho, you may lose coins.',
            color: Colors.Yellow,
            footer: {
              text: '25% chance to lose.'
            }
          }
        ],
        components: [row]
      });

      const collector = mm.createMessageComponentCollector({
        idle: 10_000
      });

      collector.on('collect', async (button) => {
        if (joined.includes(button.user.id)) {
          return button.reply({
            ephemeral: true,
            content: "You've already joined the heist."
          });
        }
        joined.push(button.user.id);
        return button.reply({
          ephemeral: true,
          content: "You've joined the heist, good luck!"
        });
      });

      collector.on('end', async () => {
        if (joined.length < 1) {
          message.channel.send('The heist failed!').then(async (a) => {
            await sleep(2500);
            a.delete();
            mm.delete();
          });
          return;
        }
        const pool = joined.length * (Math.floor(Math.random() * 100) + 300);
        const failed = [];
        const won = [];
        for (let i = 0; i < joined.length; i++) {
          if (Math.random() < 0.25) {
            failed.push(joined[i]);
            const coins = ((await getUser(joined[i])).coins || 0) / 10;
            await removeCoins(joined[i], Number(coins.toFixed(0)));
          } else {
            won.push(joined[i]);
          }
        }

        won.forEach(async (a) => {
          await addCoins(a, Number((pool / won.length - 1).toFixed(0)));
        });

        const m = await message.channel.send({
          embeds: [
            {
              title: 'Heist Winners',
              color: Colors.Green,
              description:
                won.map((a) => `<@${a}>`).join(' ') +
                ` have won <:token:1003272629286883450> **${(
                  pool / won.length -
                  1
                )
                  .toFixed(0)
                  .toLocaleLowerCase()}** coins each!`
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
        mm.delete();
        m.delete();
      });
    } else if (randomEvent == 'math') {
      const num1 = Math.floor(Math.random() * 500);
      const num2 = Math.floor(Math.random() * 500);

      const m = await message.channel.send({
        embeds: [
          {
            title: 'Math Test :nerd:',
            color: Colors.Yellow,
            description: `What's **${num1}+${num2}**?`,
            footer: {
              text: 'First to answer gets a random amount of coins!'
            }
          }
        ]
      });
      const col = message.channel.createMessageCollector({
        filter: (m) => m.content == num1 + num2
      });
      col.on('collect', async (msg) => {
        const coins = Math.ceil(Math.random() * 100) + 100;
        await addCoins(msg.author.id, coins);
        col.stop();
        message.channel
          .send(
            `:nerd: ${msg.author.toString()} :nerd: was the first to answer! They got <:token:1003272629286883450> **${coins}** coins!`
          )
          .then(async (am) => {
            await sleep(2500);
            m.delete();
            am.delete();
          });

        return;
      });
    } else if (randomEvent == 'boss') {
    }
  }
};

const addCd = async (userId) => {
  cd.push(userId);
  await sleep(1000 * 60 * 10);
  cd = cd.filter((a) => a != userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
const removeCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins -= Number(amount);
  user.save();
};
const addCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins += amount;
  user.save();
};

const getUser = async (userId) => {
  let dbu = await Database.findOne({
    userId
  });
  if (!dbu) {
    dbu = new Database({
      userId,
      coins: 0
    });
  }
  return dbu;
};
