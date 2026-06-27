const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/models/lastping');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');
const { errorEmbed, infoEmbed } = require('../../utils/embeds');

const PAGE_SIZE = 5;
const MAX_PREVIEW_LENGTH = 120;
const HIDDEN_CHANNEL_ID = '870240187198885888';

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function formatPreview(content) {
  const cleaned = content?.replace(/\s+/g, ' ').trim();
  return truncate(cleaned || '[no content]', MAX_PREVIEW_LENGTH);
}

function createNavRow(messageId, totalPages, disabled = false) {
  return new ActionRowBuilder().addComponents([
    new ButtonBuilder()
      .setEmoji('911971090954326017')
      .setCustomId(`lastping_prev_${messageId}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || totalPages <= 1),
    new ButtonBuilder()
      .setLabel('Delete')
      .setCustomId(`lastping_delete_${messageId}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setEmoji('911971202048864267')
      .setCustomId(`lastping_next_${messageId}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || totalPages <= 1)
  ]);
}

async function createLastPingDescription(message, pings, page) {
  const start = page * PAGE_SIZE;
  const pagePings = pings.slice(start, start + PAGE_SIZE);

  if (!pagePings.length) {
    return 'You have no recent pings.';
  }

  return (await Promise.all(
    pagePings.map(async (ping, index) => {
      const pinger =
        (await message.client.users.fetch(ping.pingerId).catch(() => null))?.tag ||
        'Unknown user';
      const number = String(start + index + 1).padStart(2, '0');

      return `\`${number}.\` **${pinger}** - <t:${ping.msg.when}:R>\n${formatPreview(ping.msg.content)} [jump](${ping.msg.url})`;
    })
  )).join('\n\n');
}

function createFooter(pings, page) {
  if (!pings.length) return 'No pings stored.';

  const totalPages = Math.max(1, Math.ceil(pings.length / PAGE_SIZE));
  return `Page ${page + 1}/${totalPages} - ${pings.length} ping${pings.length === 1 ? '' : 's'}`;
}

async function createLastPingPayload(message, pings, page, disabled = false) {
  const totalPages = Math.max(1, Math.ceil(pings.length / PAGE_SIZE));

  return {
    embeds: [
      infoEmbed({
        title: 'Last Pings',
        description: await createLastPingDescription(message, pings, page),
        footer: createFooter(pings, page)
      })
    ],
    components: pings.length ? [createNavRow(message.id, totalPages, disabled)] : [],
    allowedMentions: { roles: [], users: [] }
  };
}

module.exports = {
  name: 'lastping',
  aliases: ['lp'],

  async execute(message) {
    const allowedRoles = config.roles.lastPingAllowed;
    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message
        .reply({
          embeds: [
            errorEmbed({
              description: `You need one of these roles to use this command:\n${allowedRoles.map((a) => `<@&${a}>`).join(' ')}`
            })
          ]
        })
        .then(async (msg) => {
          await sleep(2500);
          msg?.delete().catch(() => {});
        });
    }

    if (message.channel.id === HIDDEN_CHANNEL_ID) {
      return message.reply("You can't run this command here");
    }

    const userId = message.author.id;
    const user = await Database.findOne({ userId });
    const pings = [...(user?.pings || [])]
      .sort((a, b) => Number(b.msg.when) - Number(a.msg.when));
    let page = 0;
    const totalPages = Math.max(1, Math.ceil(pings.length / PAGE_SIZE));

    const reply = await message.reply(await createLastPingPayload(message, pings, page));

    if (!pings.length) return;

    const collector = reply.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      idle: 60000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === `lastping_prev_${message.id}`) {
        page--;
        if (page < 0) page = totalPages - 1;
      } else if (interaction.customId === `lastping_next_${message.id}`) {
        page++;
        if (page >= totalPages) page = 0;
      } else if (interaction.customId === `lastping_delete_${message.id}`) {
        user.pings = [];
        await user.save();
        collector.stop('deleted');
        return interaction.update(await createLastPingPayload(message, [], 0));
      }

      await interaction.update(await createLastPingPayload(message, pings, page));
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'deleted') return;
      reply.edit(await createLastPingPayload(message, pings, page, true)).catch(() => {});
    });
  }
};
