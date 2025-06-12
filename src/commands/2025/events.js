const { Message, Client, EmbedBuilder, Colors } = require('discord.js');

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
          text: 'You get one try! Click the correct button to start!'
        })
        .setDescription(
          `<:UpsideDownCup:1382593749036695654><:UpsideDownCup:1382593749036695654><:UpsideDownCup:1382593749036695654>`
        );

      const mainMessage = await message.channel.send({
        embeds: [ballEmbed]
      });
    }
  }
};
