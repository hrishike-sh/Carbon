const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const EVENTS = ['find_the_ball'];

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
          '<:UpsideDownCup:1382593749036695654>   <:UpsideDownCup:1382593749036695654>   <:UpsideDownCup:1382593749036695654>',
        components: [row]
      });
      const collector = mainMessage.createMessageComponentCollector({
        idle: 30_000
      });

      collector.on('collect', async (button) => {
        button.reply(button.customId);
      });
    }
  }
};
