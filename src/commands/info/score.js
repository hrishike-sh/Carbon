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
    console.log('Command executed: score');
    const msg = await message.channel.send({
      embeds: [
        {
          title: 'Fetching data...'
        }
      ]
    });

    try {
      console.log('Fetching data from API...');
      const req = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
      );
      if (!req.ok) {
        console.error('Error fetching data:', req.status);
        throw new Error(req.status);
      }

      const data = await req.json();
      console.log('Data fetched successfully');
      const match = data.data[0];
      console.log(match);
      const embed = new EmbedBuilder().setTitle(match.title).setColor(0x00ffff);
      for (let i = 0; i < 2; i++) {
        embed.addFields({
          name: match.teams[i].name,
          value: `**Score:** ${match.score.r}.${match.score.w}\n**Overs:** ${match.score.o}`
        });
      }

      await msg.edit({ embeds: [embed] });
      console.log('Message edited with match data');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
};
