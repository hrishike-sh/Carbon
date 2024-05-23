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
    const embedRaw = [];
    for (let i = 0; i < data.length; i++) {
      embedRaw.push({
        name: 'Case #' + data[i].case_id,
        value: `Moderator: ${fetchUser(
          message,
          data[i].moderator_id
        )}\nAction: ${data[i].action.toUpperCase()}\nWhen: <t:${(
          new Date(data[i].timestamp).getTime() / 1000
        ).toFixed(0)}:R>`
      });
    }
    const embedData = breakArray(embedRaw);

    const embed = new EmbedBuilder()
      .setTitle(
        'Modlogs for: ' +
          (await fetchUser(message, embedData[0][0].offender_id))?.tag ||
          '????#????'
      )
      .setColor('Green')
      .setTimestamp();
    if (embedData.length > 1) {
    } else {
      embed.addFields(embedData[0]);
      message.reply({
        embeds: [embed]
      });
    }
  }
};

const getData = async (t) => {
  const url = t.toJSON().url;
  const data = await fetch(url);
  const text = await data.text();
  return JSON.parse(text);
};

const fetchUser = async (message, id) => {
  return await message.client.users.fetch(id, {
    cache: true
  });
};

const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 9) {
    chunks.push(array.slice(i, i + 9));
  }
  return chunks;
};
