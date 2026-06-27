const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/models/lastping');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');
const { errorEmbed, infoEmbed } = require('../../utils/embeds');

const MAX_DISPLAYED_PINGS = 10;
const MAX_PREVIEW_LENGTH = 90;
const HIDDEN_CHANNEL_ID = '870240187198885888';

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function formatPreview(content) {
  const cleaned = content?.replace(/\s+/g, ' ').trim();
  return truncate(cleaned || '[no content]', MAX_PREVIEW_LENGTH);
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
    const totalPings = user?.pings?.length || 0;
    const pings = [...(user?.pings || [])]
      .sort((a, b) => Number(b.msg.when) - Number(a.msg.when))
      .slice(0, MAX_DISPLAYED_PINGS);

    const description = pings.length
      ? (await Promise.all(
          pings.map(async (ping, index) => {
            const pinger =
              (await message.client.users.fetch(ping.pingerId).catch(() => null))?.tag ||
              'Unknown user';

            return `\`${index + 1}.\` <t:${ping.msg.when}:R> **${pinger}**: ${formatPreview(ping.msg.content)} [jump](${ping.msg.url})`;
          })
        )).join('\n')
      : 'You have no recent pings.';

    const components = pings.length
      ? [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId(`lastping_clear_${message.id}`)
              .setEmoji('🗑')
              .setStyle(ButtonStyle.Secondary)
          ])
        ]
      : [];

    const reply = await message.reply({
      embeds: [
        infoEmbed({
          title: 'Last Pings',
          description,
          footer: pings.length
            ? `Showing ${pings.length}/${totalPings}.`
            : 'Only 10 pings are stored.'
        })
      ],
      components,
      allowedMentions: { roles: [], users: [] }
    });

    if (user?.pings?.length > MAX_DISPLAYED_PINGS) {
      user.pings = pings;
      await user.save();
    }

    if (!pings.length) return;

    reply
      .awaitMessageComponent({
        filter: (interaction) => interaction.user.id === message.author.id,
        time: 60000
      })
      .then(async (interaction) => {
        user.pings = [];
        await user.save();
        await interaction.update({
          embeds: [
            infoEmbed({
              title: 'Last Pings',
              description: 'Your pings have been cleared.',
              footer: 'Only 10 pings are stored.'
            })
          ],
          components: []
        });
      })
      .catch(() => {
        reply.edit({ components: [] }).catch(() => {});
      });
  }
};
