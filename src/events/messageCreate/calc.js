const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'calc',

  async execute(message) {
    const regex = /^\d+(\s*[+\-*/]\s*\d+)*$/;
    if (!regex.test(message.content)) return;

    const secondRegex = /(\+|-|\/|\*)/g;
    if (!secondRegex.test(message.content)) return;

    await message.react('➕');

    try {
      const collected = await message.awaitReactions({
        max: 1,
        time: 10000,
        errors: ['time'],
        filter: (_, user) => !user.bot
      });

      const reaction = collected.first();
      if (reaction.emoji.name === '➕') {
        const math = require('mathjs');
        const result = math.evaluate(message.content);
        await message.reply({
          embeds: [
            infoEmbed({ description: `Calculated: **${result.toLocaleString()}**` })
          ]
        });
      }
    } catch {}
  }
};
