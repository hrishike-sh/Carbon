const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Colors
} = require('discord.js');
const roll = require('../../database/roll');
const Cooldown = new Set();
module.exports = {
  name: 'roll',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (args[0] == 'reset') {
      if (message.member.roles.cache.has('1016728636365209631')) {
        await roll.deleteMany({});
        return message.reply('All rolls have been reset.');
      }
    }

    setTimeout(() => {
      Cooldown.delete(message.author.id);
    }, 30000);
    const userScore =
      (
        await roll.findOne({
          userId: message.author.id
        })
      )?.amount || 0;
    const lb = await roll.find({}).sort({ amount: -1 }).limit(10);
    const embed = new EmbedBuilder()
      .setTitle('Carbon TopRoll')
      .setDescription(
        `**Leaderboard**\n${lb
          .map((a, ind) => `${ind + 1}. <@${a.userId}>: ${a.amount}`)
          .join('\n')}`
      )
      .addFields([
        {
          name: 'Your game',
          value: "Click on 'Start' to play!"
        }
      ])
      .setFooter({
        text: `Previous score: ${userScore}`
      })
      .setColor(Colors.Green);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId('start')
        .setLabel('Start')
    ]);
    if (Cooldown.has(message.author.id)) {
      row.components[0]
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary)
        .setLabel('30s Cooldown!');
    }
    Cooldown.add(message.author.id);
    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => {
        if (i.user.id !== message.author.id) {
          i.reply({
            content: 'Not your game!',
            ephemeral: true
          });
          return false;
        } else return true;
      },
      idle: 30_000
    });
    let count = 0;
    let f = '';
    let sum = 0;
    const hist = [];
    collector.on('collect', async (button) => {
      row.components[0].setLabel('Roll!');
      const rand = Math.floor(Math.random() * 100) + 1;
      sum += rand;
      hist.push(rand);
      count++;
      f = `${hist
        .map((a, ind) => (ind + 1 == count ? `**${a}**` : a))
        .join(' -> ')}`;
      if (count == 6) {
        row.components.forEach((a) => a.setDisabled(true));
        f = `${hist
          .map((a) => a.toString())
          .join(' -> ')}\n\nNew Score: **${sum}**`;
        await roll.updateOne(
          {
            userId: message.author.id
          },
          {
            $set: {
              userId: message.author.id,
              amount: sum
            }
          },
          {
            upsert: true
          }
        );
      }
      embed.setFields([
        {
          name: 'Your game',
          value: f
        }
      ]);

      await button.update({ embeds: [embed], components: [row] });
    });
  }
};
