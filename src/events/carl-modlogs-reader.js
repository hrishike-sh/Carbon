const {
  Message,
  Embed,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction
} = require('discord.js');

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
        value: `Action: ${data[i].action.toUpperCase()}\nWhen: <t:${(
          new Date(data[i].timestamp).getTime() / 1000
        ).toFixed(0)}:R>\nReason: ${data[i].reason}`,
        inline: true
      });
    }
    const embedData = breakArray(embedRaw);

    const embed = new EmbedBuilder().setColor('Green');
    if (embedData.length > 1) {
      let index = 0;
      embed.setFields(embedData[0]);

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setEmoji('⏮')
          .setCustomId('cml_first')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setEmoji('⬅')
          .setCustomId('cml_previous')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(`1/${embedData.length - 1}`)
          .setCustomId('a')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(),
        new ButtonBuilder()
          .setEmoji('➡')
          .setCustomId('cml_next')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setEmoji('⏭')
          .setCustomId('cml_last')
          .setStyle(ButtonStyle.Primary)
      ]);

      const msg = await message.reply({
        embeds: [embed],
        components: [row]
      });
      const collector = msg.createMessageComponentCollector({
        idle: 60_000
      });

      collector.on('collect', async (button) => {
        switch (button.customId) {
          case 'cml_first':
            index = 0;
            break;
          case 'cml_previous':
            index == 0 ? null : index--;
            break;
          case 'cml_next':
            index == embedData.length - 1 ? null : index++;
            break;
          case 'cml_last':
            index = embedData.length - 1;
            break;
        }
        button.deferUpdate();
        embed.setFields(embedData[index]);
        msg.components[0].components[2].setLabel(
          `${index + 1}/${embedData.length - 1}`
        );
        msg.edit({
          embeds: [embed],
          components: msg.components
        });
      });
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

const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 9) {
    chunks.push(array.slice(i, i + 9));
  }
  return chunks;
};
