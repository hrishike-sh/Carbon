const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} = require('discord.js');

const EVENTS = ['find_the_ball', 'emoji_memory'];

module.exports = {
  name: 'events',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const index = args[0] ?? Math.floor(Math.random() * EVENTS.length);

    if (index == 0) {
      // find the ball

      const ballEmbed = new EmbedBuilder()
        .setTitle('Guess where the ball is!')
        .setColor(Colors.Yellow)
        .setFooter({
          text: 'You get one try! Click the button to guess!'
        });

      const row = new ActionRowBuilder().addComponents(
        [
          new ButtonBuilder()
            .setCustomId('ball')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('not_ball_1')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('not_ball_2')
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
        ].sort(() => Math.random() - 0.5)
      );

      await message.channel.send({
        embeds: [ballEmbed]
      });

      const mainMessage = await message.channel.send({
        content:
          '<:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>',
        components: [row]
      });
      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      collector.on('collect', async (button) => {
        button.reply(button.customId);
      });
    } else if (index == 1) {
      const emojis = [
        '🏊',
        '👡',
        '😎',
        '🌻',
        '🏝️',
        '🕶️',
        '👕',
        '🌴',
        '☀️',
        '👙',
        '🌞',
        '🍹',
        '🏄',
        '🥵',
        '🩱',
        '🩴',
        '🩳',
        '🍦',
        '🍨',
        '🧢',
        '🌄',
        '🌅',
        '🌡️',
        '🌊',
        '🥥'
      ].sort(() => Math.random() - 0.5);

      const toShow = emojis.slice(0, 5);

      const mainMessage = await message.channel.send({
        content: 'Memorise the following emojis!'
      });

      for (let i = 0; i < toShow.length; i++) {
        await sleep(1500);
        await mainMessage.edit({
          content: toShow[i++]
        });
      }

      await sleep(1000);
      const mainEmbed = new EmbedBuilder()
        .setTitle('Memorize')
        .setDescription('Now click the emojis in order to win!')
        .setColor(Colors.Yellow)
        .setFooter({
          text: 'You get one try only!'
        });
      const p = emojis.slice(0, 10).sort(() => Math.random() - 0.5);
      const row = new ActionRowBuilder().addComponents([
        p.slice(0, 5).map((emoji) => {
          return new ButtonBuilder()
            .setCustomId(emoji)
            .setEmoji(emoji)
            .setStyle(ButtonStyle.Secondary);
        }),
        p.slice(5, 10).map((emoji) => {
          return new ButtonBuilder()
            .setCustomId(emoji)
            .setEmoji(emoji)
            .setStyle(ButtonStyle.Secondary);
        })
      ]);

      await mainMessage.edit({
        content: '',
        embeds: [mainEmbed],
        components: [row]
      });

      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      const gameData = new Collection();

      collector.on('collect', async (button) => {
        button.reply(button.customId);
      });
    }
  }
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
