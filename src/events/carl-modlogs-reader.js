const {
  Message,
  Embed,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  InteractionType,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const getAction = (str) => {
  if (str.includes('unban')) return '🚪 Unban';
  if (str.includes('ban')) return '🔨 Ban';
  if (str.includes('mute')) return '🔇 Mute';
  if (str.includes('warn')) return '⚠ Warn';
};
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
    let embedRaw = [];
    for (let i = 0; i < data.length; i++) {
      const user =
        message.client.users.cache.get(data[i].moderator_id)?.tag ||
        (
          await message.client.users
            .fetch(data[i].moderator_id)
            .catch(() => null)
        )?.tag ||
        data[i].moderator_id;
      embedRaw.push({
        name: `#${data[i].case_id} | ${getAction(
          data[i].action.toLowerCase()
        )} | <t:${(new Date(data[i].timestamp).getTime() / 1000).toFixed(
          0
        )}:R>`,
        value: `Moderator: ${user}\nReason: ${data[i].reason}`,
        inline: true
      });
    }
    let embedData = breakArray(embedRaw);

    const embed = new EmbedBuilder().setColor('Green').setFooter({
      text: `Total ${data.length.toLocaleString()} cases`
    });
    if (embedData.length > 1) {
      let index = 0;
      let filter = 'none';
      embed.setFields(embedData[0]);

      const row0 = new ActionRowBuilder().addComponents([
        new StringSelectMenuBuilder()
          .setMaxValues(1)
          .setMinValues(1)
          .setCustomId('filter')
          .setPlaceholder('Select a filter...')
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel('Mutes')
              .setValue('mute')
              .setDescription('Filter modlogs by mutes.')
              .setEmoji('🔇'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Bans')
              .setValue('ban')
              .setEmoji('🔨')
              .setDescription('Filter modlogs by bans.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Unbans')
              .setEmoji('🚪')
              .setValue('unban')
              .setDescription('Filter modlogs by unbans.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Warns')
              .setEmoji('⚠')
              .setValue('warn')
              .setDescription('Filter modlogs by warns.'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Reset Filter')
              .setValue('all')
              .setEmoji('🧹')
              .setDescription('Reset filter.')
          ])
      ]);

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setEmoji('⏮')
          .setCustomId('cml_first_b')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setEmoji('⬅')
          .setCustomId('cml_previous_b')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(`1/${embedData.length}`)
          .setCustomId('a')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(),
        new ButtonBuilder()
          .setEmoji('➡')
          .setCustomId('cml_next_b')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setEmoji('⏭')
          .setCustomId('cml_last_b')
          .setStyle(ButtonStyle.Primary)
      ]);

      const msg = await message.reply({
        embeds: [embed],
        components: [row0, row]
      });
      const collector = msg.createMessageComponentCollector({
        idle: 60_000
      });

      collector.on('collect', async (button) => {
        if (button.customId.includes('_b')) {
          switch (button.customId) {
            case 'cml_first_b':
              index = 0;
              break;
            case 'cml_previous_b':
              index == 0 ? null : index--;
              break;
            case 'cml_next_b':
              index == embedData.length - 1 ? null : index++;
              break;
            case 'cml_last_b':
              index = embedData.length - 1;
              break;
          }
          button.deferUpdate();
          embed.setFields(embedData[index]);
          row.setComponents([
            new ButtonBuilder()
              .setEmoji('⏮')
              .setCustomId('cml_first_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setEmoji('⬅')
              .setCustomId('cml_previous_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setLabel(`${index + 1}/${embedData.length}`)
              .setCustomId('a')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(),
            new ButtonBuilder()
              .setEmoji('➡')
              .setCustomId('cml_next_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setEmoji('⏭')
              .setCustomId('cml_last_b')
              .setStyle(ButtonStyle.Primary)
          ]);
          msg.edit({
            embeds: [embed],
            components: [row0, row]
          });
        } else {
          button.deferUpdate();
          filter = button.values[0];
          embedRaw = [];
          for (let i = 0; i < data.length; i++) {
            if (filter == 'all') {
              const user =
                message.client.users.cache.get(data[i].moderator_id)?.tag ||
                (
                  await message.client.users
                    .fetch(data[i].moderator_id)
                    .catch(() => null)
                )?.tag ||
                data[i].moderator_id;
              embedRaw.push({
                name: `#${data[i].case_id} | ${getAction(
                  data[i].action.toLowerCase()
                )} | <t:${(
                  new Date(data[i].timestamp).getTime() / 1000
                ).toFixed(0)}:R>`,
                value: `Moderator: ${user}\nReason: ${data[i].reason}`,
                inline: true
              });
            } else {
              if (data[i].action !== filter) {
                continue;
              }
              const user =
                message.client.users.cache.get(data[i].moderator_id)?.tag ||
                (
                  await message.client.users
                    .fetch(data[i].moderator_id)
                    .catch(() => null)
                )?.tag ||
                data[i].moderator_id;
              embedRaw.push({
                name: `#${data[i].case_id} | ${getAction(
                  data[i].action.toLowerCase()
                )} | <t:${(
                  new Date(data[i].timestamp).getTime() / 1000
                ).toFixed(0)}:R>`,
                value: `Moderator: ${user}\nReason: ${data[i].reason}`,
                inline: true
              });
            }
          }
          embedData = breakArray(embedRaw);

          index = 0;

          embed.setFields(embedData[index]);
          row.setComponents([
            new ButtonBuilder()
              .setEmoji('⏮')
              .setCustomId('cml_first_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setEmoji('⬅')
              .setCustomId('cml_previous_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setLabel(`${index + 1}/${embedData.length}`)
              .setCustomId('a')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(),
            new ButtonBuilder()
              .setEmoji('➡')
              .setCustomId('cml_next_b')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setEmoji('⏭')
              .setCustomId('cml_last_b')
              .setStyle(ButtonStyle.Primary)
          ]);
          msg.edit({
            embeds: [embed],
            components: [row0, row]
          });
        }
      });
      collector.on('end', () => {
        row0.components[0].setDisabled();
        row.setComponents([
          new ButtonBuilder()
            .setEmoji('⏮')
            .setCustomId('cml_first_b')
            .setDisabled()
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setEmoji('⬅')
            .setCustomId('cml_previous_b')
            .setDisabled()
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel(`${index + 1}/${embedData.length}`)
            .setCustomId('a')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(),
          new ButtonBuilder()
            .setEmoji('➡')
            .setDisabled()
            .setCustomId('cml_next_b')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setEmoji('⏭')
            .setDisabled()
            .setCustomId('cml_last_b')
            .setStyle(ButtonStyle.Primary)
        ]);

        msg.edit({
          components: [row0, row]
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
