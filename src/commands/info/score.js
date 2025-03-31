const { Client, Message, EmbedBuilder } = require('discord.js');
const API_KEY = process.env.SCORE_API;

module.exports = {
  name: 'score',
  aliases: ['ipl'],
  cooldown: 3,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    const msg = await message.channel.send({
      embeds: [
        {
          title: 'Fetching data...'
        }
      ]
    });

    try {
      const req = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
      );
      if (!req.ok) {
        throw new Error(req.status);
      }

      const data = await req.json();
      const match = data.data[0];
      const embed = new EmbedBuilder().setTitle(match.title).setColor(0x00ffff);
      for (let i = 0; i < 2; i++) {
        embed.addFields({
          name: match.teams[i].name,
          value: `**Score:** ${match.score.r}.${match.score.w}\n**Overs:** ${match.score.o}`
        });
      }

      await msg.edit({ embeds: [embed] });
    } catch (error) {}
  }
};
