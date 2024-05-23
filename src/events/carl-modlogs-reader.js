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

    const data = getData(message.attachments.first());
    const embed = new EmbedBuilder()
      .setTitle(data[0].offender_id)
      .setDescription('You can filter types of modlogs.')
      .setTimestamp()
      .setColor('NotQuiteBlack');
    for (const d of data) {
      embed.addFields({
        name: `Case #${d.case_id}`,
        value: `Moderator: <@${d.moderator_id}>\nType: WARN\nWhen: <t:${(
          Number(d.timestamp) / 1000
        ).toFixed(0)}:R>`
      });
    }

    message.channel.send({
      embeds: [embed]
    });
  }
};

function getData(t) {
  t.toJSON()
    .then((b) => b.text())
    .then((a) => {
      return JSON.parse(a);
    });
}
