const { infoEmbed } = require('../../utils/embeds');

const API_KEY = process.env.SCORE_API;

module.exports = {
  name: 'score',
  aliases: ['ipl'],
  cooldown: 3,

  async execute(message, args) {
    if (!API_KEY) return message.reply('Score lookup is not configured.');
    const msg = await message.channel.send({
      embeds: [infoEmbed({ title: 'Fetching data...' })]
    });

    try {
      const req = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(API_KEY)}&offset=0`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!req.ok) throw new Error(req.status);

      const data = await req.json();
      const match = data.data?.[0];
      if (!match) return msg.edit({ embeds: [infoEmbed({ title: 'No current matches found.' })] });
      const embed = infoEmbed({
        title: match.name,
        description: match.status,
        thumbnail: 'https://www.jagranimages.com/images/newimg/21082020/21_08_2020-ipl_logo_20650553.jpg',
        footer: match.venue,
        timestamp: true
      });

      for (const inning of (match.score || []).slice(0, 25)) {
        embed.addFields({
          name: inning.inning?.split('Inning')[0] || 'Innings',
          value: `**Score:** ${inning.r}/${inning.w}\n**Overs:** ${inning.o}`,
          inline: true
        });
      }

      await msg.edit({ embeds: [embed] });
    } catch (error) {
      await msg.edit({ embeds: [infoEmbed({ title: 'Failed to fetch score data.' })] });
    }
  }
};
