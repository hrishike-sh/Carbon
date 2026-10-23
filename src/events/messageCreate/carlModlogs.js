const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

const CARL_BOT_ID = '235148962103951360';
const MAX_EXPORT_BYTES = 8 * 1024 * 1024;
const MAX_FIELDS_PER_PAGE = 9;
const MAX_FIELD_VALUE_LENGTH = 1024;
const MAX_PAGE_FIELD_CHARACTERS = 5_200;
const COLLECTOR_IDLE_MS = 5 * 60_000;

const ACTIONS = {
  ban: { label: 'Ban', plural: 'Bans', emoji: '🔨' },
  kick: { label: 'Kick', plural: 'Kicks', emoji: '👢' },
  mute: { label: 'Mute', plural: 'Mutes', emoji: '🔇' },
  unban: { label: 'Unban', plural: 'Unbans', emoji: '🚪' },
  unmute: { label: 'Unmute', plural: 'Unmutes', emoji: '🔊' },
  warn: { label: 'Warn', plural: 'Warnings', emoji: '⚠️' }
};

function truncate(value, maxLength) {
  const text = String(value ?? '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function humanizeAction(action) {
  return action
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';
}

function getActionMeta(action) {
  return ACTIONS[action] || {
    label: humanizeAction(action),
    plural: humanizeAction(action),
    emoji: '❓'
  };
}

function parseTimestamp(value) {
  if (!value) return null;

  let timestamp = String(value).trim();
  // Carl exports UTC timestamps without a timezone suffix.
  if (/^\d{4}-\d{2}-\d{2}T/.test(timestamp) &&
      !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)) {
    timestamp += 'Z';
  }

  const milliseconds = Date.parse(timestamp);
  return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 1000) : null;
}

function normalizeCase(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const action = String(entry.action || '').trim().toLowerCase();
  const caseId = String(entry.case_id ?? '').trim();
  if (!action || !caseId) return null;

  return {
    caseId,
    moderatorId: String(entry.moderator_id ?? '').trim(),
    offenderId: String(entry.offender_id ?? '').trim(),
    action,
    timestamp: parseTimestamp(entry.timestamp),
    reason: String(entry.reason || 'No reason provided.').trim() || 'No reason provided.'
  };
}

function parseExportText(text) {
  if (typeof text !== 'string') throw new TypeError('The export must be text.');

  // Discord snowflakes exceed JavaScript's safe integer range. Quote unquoted *_id
  // values before JSON.parse so their final digits are not silently rounded.
  const snowflakeSafeJson = text
    .replace(/^\uFEFF/, '')
    .replace(/("[A-Za-z0-9_]*_id"\s*:\s*)(\d{15,})(?=\s*[,}])/g, '$1"$2"');

  const parsed = JSON.parse(snowflakeSafeJson);
  if (!Array.isArray(parsed)) throw new TypeError('The export does not contain a case list.');

  const cases = parsed.map(normalizeCase).filter(Boolean);
  if (cases.length === 0) throw new TypeError('The export contains no valid cases.');
  return cases;
}

async function fetchExport(attachment) {
  if (attachment.size && attachment.size > MAX_EXPORT_BYTES) {
    throw new RangeError('The export is too large.');
  }

  const response = await fetch(attachment.url);
  if (!response.ok) throw new Error(`Carl export download failed (${response.status}).`);

  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_EXPORT_BYTES) {
    throw new RangeError('The export is too large.');
  }
  return parseExportText(text);
}

function isTextAttachment(attachment) {
  if (!attachment) return false;
  const contentType = attachment.contentType?.split(';')[0].trim().toLowerCase();
  return contentType === 'text/plain' || attachment.name?.toLowerCase().endsWith('.txt');
}

async function resolveModerators(client, cases) {
  const moderatorIds = [...new Set(cases.map((entry) => entry.moderatorId).filter(Boolean))];
  const moderators = new Map();

  await Promise.all(moderatorIds.map(async (id) => {
    const user = client.users.cache.get(id) ||
      await client.users.fetch(id).catch(() => null);
    moderators.set(id, user?.tag || user?.username || id);
  }));

  return moderators;
}

function buildCaseFields(cases, moderators = new Map()) {
  return cases.map((entry) => {
    const action = getActionMeta(entry.action);
    const relativeTime = entry.timestamp ? ` | <t:${entry.timestamp}:R>` : '';
    const moderator = moderators.get(entry.moderatorId) || entry.moderatorId || 'Unknown';
    const prefix = `**Moderator:** ${moderator}\n**Reason:** `;
    const reason = truncate(entry.reason, MAX_FIELD_VALUE_LENGTH - prefix.length);

    return {
      name: truncate(`#${entry.caseId} | ${action.emoji} ${action.label}${relativeTime}`, 256),
      value: `${prefix}${reason}`,
      inline: true
    };
  });
}

function paginateFields(fields) {
  const pages = [];
  let page = [];
  let pageCharacters = 0;

  for (const field of fields) {
    const fieldCharacters = field.name.length + field.value.length;
    if (page.length > 0 &&
        (page.length >= MAX_FIELDS_PER_PAGE ||
         pageCharacters + fieldCharacters > MAX_PAGE_FIELD_CHARACTERS)) {
      pages.push(page);
      page = [];
      pageCharacters = 0;
    }

    page.push(field);
    pageCharacters += fieldCharacters;
  }

  if (page.length > 0) pages.push(page);
  return pages.length > 0 ? pages : [[]];
}

function getSubject(cases) {
  const offenderIds = [...new Set(cases.map((entry) => entry.offenderId).filter(Boolean))];
  if (offenderIds.length === 1) return `User: <@${offenderIds[0]}>`;
  if (offenderIds.length > 1) return `${offenderIds.length.toLocaleString()} users`;
  return null;
}

function buildFilterRow(actions, activeFilter, disabled = false) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('cml_filter')
    .setPlaceholder('Filter cases by action')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('All cases')
        .setValue('all')
        .setDescription('Remove the action filter')
        .setEmoji('🧹')
        .setDefault(activeFilter === 'all'),
      ...actions.slice(0, 24).map((action) => {
        const meta = getActionMeta(action);
        return new StringSelectMenuOptionBuilder()
          .setLabel(truncate(meta.plural, 100))
          .setValue(action)
          .setDescription(truncate(`Show only ${meta.plural.toLowerCase()}`, 100))
          .setEmoji(meta.emoji)
          .setDefault(activeFilter === action);
      })
    );

  return new ActionRowBuilder().addComponents(menu);
}

function buildNavigationRow(pageIndex, pageCount, disabled = false) {
  const atFirstPage = pageIndex === 0;
  const atLastPage = pageIndex === pageCount - 1;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('cml_first')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || atFirstPage),
    new ButtonBuilder()
      .setCustomId('cml_previous')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || atFirstPage),
    new ButtonBuilder()
      .setCustomId('cml_page')
      .setLabel(`${pageIndex + 1}/${pageCount}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('cml_next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || atLastPage),
    new ButtonBuilder()
      .setCustomId('cml_last')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || atLastPage)
  );
}

module.exports = {
  name: 'carlModlogs',

  async execute(message) {
    if (message.author.id !== CARL_BOT_ID) return;
    if (!/exported\s+\d+\s+cases?/i.test(message.content)) return;

    const attachment = message.attachments?.first();
    if (!isTextAttachment(attachment)) return;

    let cases;
    try {
      cases = await fetchExport(attachment);
    } catch (error) {
      await message.reply({
        embeds: [errorEmbed({
          title: 'Could not read Carl-bot export',
          description: 'The attached file was not a valid Carl-bot moderation log export.'
        })],
        allowedMentions: { repliedUser: false }
      }).catch(() => {});
      throw error;
    }

    const moderators = await resolveModerators(message.client, cases);
    const actions = [...new Set(cases.map((entry) => entry.action))].sort();
    const subject = getSubject(cases);
    const embed = successEmbed({ title: 'Carl-bot Moderation Cases' });
    let activeFilter = 'all';
    let pageIndex = 0;
    let filteredCases = cases;
    let pages = paginateFields(buildCaseFields(filteredCases, moderators));

    const getComponents = (disabled = false) => {
      const components = [];
      if (actions.length > 1) {
        components.push(buildFilterRow(actions, activeFilter, disabled));
      }
      components.push(buildNavigationRow(pageIndex, pages.length, disabled));
      return components;
    };

    const updateEmbed = () => {
      const filterLabel = activeFilter === 'all'
        ? 'All actions'
        : getActionMeta(activeFilter).plural;
      embed
        .setDescription([subject, `Filter: **${filterLabel}**`].filter(Boolean).join('\n'))
        .setFields(pages[pageIndex])
        .setFooter({
          text: `Carbon • ${filteredCases.length.toLocaleString()} of ${cases.length.toLocaleString()} cases • Page ${pageIndex + 1}/${pages.length}`
        });
    };

    updateEmbed();
    const reply = await message.reply({
      embeds: [embed],
      components: getComponents(),
      allowedMentions: { repliedUser: false }
    });

    const collector = reply.createMessageComponentCollector({ idle: COLLECTOR_IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (interaction.isStringSelectMenu() && interaction.customId === 'cml_filter') {
        activeFilter = interaction.values[0];
        filteredCases = activeFilter === 'all'
          ? cases
          : cases.filter((entry) => entry.action === activeFilter);
        pages = paginateFields(buildCaseFields(filteredCases, moderators));
        pageIndex = 0;
      } else if (interaction.isButton()) {
        switch (interaction.customId) {
          case 'cml_first': pageIndex = 0; break;
          case 'cml_previous': pageIndex = Math.max(0, pageIndex - 1); break;
          case 'cml_next': pageIndex = Math.min(pages.length - 1, pageIndex + 1); break;
          case 'cml_last': pageIndex = pages.length - 1; break;
          default: return;
        }
      } else {
        return;
      }

      updateEmbed();
      await interaction.update({
        embeds: [embed],
        components: getComponents()
      }).catch(() => {});
    });

    collector.on('end', async () => {
      await reply.edit({ components: getComponents(true) }).catch(() => {});
    });
  },

  // Pure helpers are exported for lightweight verification without Discord.
  parseExportText,
  buildCaseFields,
  paginateFields
};
