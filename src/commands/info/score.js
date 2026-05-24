const { infoEmbed } = require('../../utils/embeds');

const API_KEY = process.env.SCORE_API;

module.exports = {
  name: 'score',
  aliases: ['ipl'],
  cooldown: 3,

  async execute(message, args) {
    const msg = await message.channel.send({
      embeds: [infoEmbed({ title: 'Fetching data...' })]
    });

    try {
      const req = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
      );
      if (!req.ok) throw new Error(req.status);

      const data = await req.json();
      const match = data.data[0];
      const embed = infoEmbed({
        title: match.name,
        description: match.status,
        thumbnail: 'https://www.jagranimages.com/images/newimg/21082020/21_08_2020-ipl_logo_20650553.jpg',
        footer: match.venue,
        timestamp: true
      });

      for (let i = 0; i < 2; i++) {
        embed.addFields({
          name: match.score[i].inning.split('Inning')[0],
          value: `**Score:** ${match.score[i].r}/${match.score[i].w}\n**Overs:** ${match.score[i].o}`,
          inline: true
        });
      }

      await msg.edit({ embeds: [embed] });
    } catch (error) {
      msg.edit({ embeds: [infoEmbed({ title: 'Failed to fetch score data.' })] });
    }
  }
};
