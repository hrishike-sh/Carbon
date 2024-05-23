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
      .setTitle(data[0].offender_id.toString())
      .setDescription('You can filter types of modlogs.')
      .setTimestamp()
      .setColor('DarkGold');
    for (let i = 0; i < data.length; i++) {
      embed.addFields({
        name: `Case #${data[i].case_id}`,
        value: `Moderator: <@${data[i].moderator_id}>\nType: ${data[
          i
        ].action.toUpperCase()}\nWhen: <t:${(
          Number(new Date(data[i].timestamp).getTime()) / 1000
        ).toFixed(0)}:R>`,
        inline: true
      });
    }

    message.channel.send({
      embeds: [embed]
    });
    message.client.users.fetch(id, {});
  }
};

const getData = async (t) => {
  const url = t.toJSON().url;
  const data = await fetch(url);
  const text = await data.text();
  return JSON.parse(text);
};

const getUser = async (message, id) => {
  const u = await message.client.users.fetch(id);
  return u.tag;
};
