const { Message, Embed, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    if (message.author.id !== '235148962103951360') return;
    const text = message.attachments?.first();
    if (
      !text?.contentType.includes('text/plain') ||
      !message.content.includes('Exported ')
    )
      return;

    const data = await getData(message.attachments.first());
    const embed = new EmbedBuilder()
      .setTitle('T')
      .setDescription('You can filter types of modlogs.')
      .setTimestamp()
      .setColor('NotQuiteBlack');
    for (let i = 0; i < data.length; i++) {
      embed.addFields({
        name: `Case #${data[i].case_id}`,
        value: `Moderator: <@${data[i].moderator_id}>\nType: WARN\nWhen: <t:${(
          Number(data[i].timestamp) / 1000
        ).toFixed(0)}:R>`
      });
    }

    message.channel.send({
      embeds: [embed]
    });
  }
};

const getData = async (t) => {
  const url = t.toJSON().url;
  const data = await fetch(url);
  const text = await data.text();
  return JSON.parse(text);
};
