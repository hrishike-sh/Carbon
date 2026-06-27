const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} = require('discord.js');
const Database = require('../../database/models/lastping');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');
const { errorEmbed } = require('../../utils/embeds');

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

async function createLastPingContainer(message, pings, page, disabled = false) {
  const totalPages = Math.max(1, Math.ceil(pings.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pagePings = pings.slice(start, start + PAGE_SIZE);

  const description = pagePings.length
    ? (await Promise.all(
        pagePings.map(async (ping, index) => {
          const pinger =
            (await message.client.users.fetch(ping.pingerId).catch(() => null))?.tag ||
            'Unknown user';
          const number = String(start + index + 1).padStart(2, '0');

          return `\`${number}.\` **${pinger}** - <t:${ping.msg.when}:R>\n${formatPreview(ping.msg.content)} [jump](${ping.msg.url})`;
        })
      )).join('\n\n')
    : 'You have no recent pings.';

  const footer = pagePings.length
    ? `Page ${page + 1}/${totalPages} - ${pings.length} ping${pings.length === 1 ? '' : 's'}`
    : 'No pings stored.';

  const container = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Last Pings'),
      new TextDisplayBuilder().setContent(description),
      new TextDisplayBuilder().setContent(`-# ${footer}`)
    );

  if (pings.length) {
    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(createNavRow(message.id, totalPages, disabled));
  }

  return container;
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

    const reply = await message.reply({
      components: [await createLastPingContainer(message, pings, page)],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { roles: [], users: [] }
    });

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
        return interaction.update({
          components: [await createLastPingContainer(message, [], 0)],
          flags: MessageFlags.IsComponentsV2
        });
      }

      await interaction.update({
        components: [await createLastPingContainer(message, pings, page)],
        flags: MessageFlags.IsComponentsV2
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'deleted') return;
      reply.edit({
        components: [await createLastPingContainer(message, pings, page, true)]
      }).catch(() => {});
    });
  }
};
