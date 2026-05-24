const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { breakArray } = require('../../utils/helpers');
const { successEmbed } = require('../../utils/embeds');

const getAction = (str) => {
  const lower = str.toLowerCase();
  if (lower.includes('unban')) return '🚪 Unban';
  if (lower.includes('ban')) return '🔨 Ban';
  if (lower.includes('mute')) return '🔇 Mute';
  if (lower.includes('warn')) return '⚠ Warn';
  return '❓ Unknown';
};

const fetchData = async (attachment) => {
  const url = attachment.toJSON().url;
  const response = await fetch(url);
  const text = await response.text();
  return JSON.parse(text);
};

module.exports = {
  name: 'carlModlogs',

  async execute(message) {
    if (message.author.id !== '235148962103951360') return;

    const attachment = message.attachments?.first();
    if (!attachment?.contentType?.includes('text/plain')) return;
    if (!message.content.includes('Exported ')) return;

    const data = await fetchData(attachment);
    let embedRaw = [];

    for (const entry of data) {
      const user =
        message.client.users.cache.get(entry.moderator_id)?.tag ||
        (await message.client.users.fetch(entry.moderator_id).catch(() => null))?.tag ||
        entry.moderator_id;

      embedRaw.push({
        name: `#${entry.case_id} | ${getAction(entry.action)} | <t:${(new Date(entry.timestamp).getTime() / 1000).toFixed(0)}:R>`,
        value: `Moderator: ${user}\nReason: ${entry.reason}`,
        inline: true
      });
    }

    let embedData = breakArray(embedRaw, 9);
    let index = 0;
    let filter = 'none';

    const embed = successEmbed({
      footer: `Total ${data.length.toLocaleString()} cases`
    });

    if (embedData.length > 1) {
      embed.setFields(embedData[0]);

      const selectRow = new ActionRowBuilder().addComponents([
        new StringSelectMenuBuilder()
          .setMaxValues(1)
          .setMinValues(1)
          .setCustomId('filter')
          .setPlaceholder('Select a filter...')
          .addOptions([
            new StringSelectMenuOptionBuilder().setLabel('Mutes').setValue('mute').setDescription('Filter by mutes').setEmoji('🔇'),
            new StringSelectMenuOptionBuilder().setLabel('Bans').setValue('ban').setDescription('Filter by bans').setEmoji('🔨'),
            new StringSelectMenuOptionBuilder().setLabel('Unbans').setValue('unban').setDescription('Filter by unbans').setEmoji('🚪'),
            new StringSelectMenuOptionBuilder().setLabel('Warns').setValue('warn').setDescription('Filter by warns').setEmoji('⚠'),
            new StringSelectMenuOptionBuilder().setLabel('Reset Filter').setValue('all').setDescription('Reset filter').setEmoji('🧹')
          ])
      ]);

      const navRow = () => new ActionRowBuilder().addComponents([
        new ButtonBuilder().setEmoji('⏮').setCustomId('cml_first_b').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setEmoji('⬅').setCustomId('cml_previous_b').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel(`${index + 1}/${embedData.length}`).setCustomId('a').setStyle(ButtonStyle.Secondary).setDisabled(),
        new ButtonBuilder().setEmoji('➡').setCustomId('cml_next_b').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setEmoji('⏭').setCustomId('cml_last_b').setStyle(ButtonStyle.Primary)
      ]);

      const msg = await message.reply({
        embeds: [embed],
        components: [selectRow, navRow()]
      });

      const collector = msg.createMessageComponentCollector({ idle: 60_000 });

      collector.on('collect', async (button) => {
        if (button.customId.includes('_b')) {
          switch (button.customId) {
            case 'cml_first_b': index = 0; break;
            case 'cml_previous_b': if (index > 0) index--; break;
            case 'cml_next_b': if (index < embedData.length - 1) index++; break;
            case 'cml_last_b': index = embedData.length - 1; break;
          }
        } else {
          filter = button.values[0];
          embedRaw = [];

          for (const entry of data) {
            if (filter !== 'all' && entry.action !== filter) continue;
            const user =
              message.client.users.cache.get(entry.moderator_id)?.tag ||
              (await message.client.users.fetch(entry.moderator_id).catch(() => null))?.tag ||
              entry.moderator_id;
            embedRaw.push({
              name: `#${entry.case_id} | ${getAction(entry.action)} | <t:${(new Date(entry.timestamp).getTime() / 1000).toFixed(0)}:R>`,
              value: `Moderator: ${user}\nReason: ${entry.reason}`,
              inline: true
            });
          }

          embedData = breakArray(embedRaw, 9);
          index = 0;
        }

        await button.deferUpdate();
        embed.setFields(embedData[index] || []);
        await msg.edit({
          embeds: [embed],
          components: [selectRow, navRow()]
        });
      });

      collector.on('end', async () => {
        selectRow.components[0].setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(
          navRow().components.map((c) => c.setDisabled(true))
        );
        await msg.edit({ components: [selectRow, disabledRow] }).catch(() => {});
      });
    } else {
      embed.addFields(embedData[0] || []);
      await message.reply({ embeds: [embed] });
    }
  }
};
