const { Events } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

const logDir = path.join(process.cwd(), 'logs', 'mafia-raw');
const mafiaChannelIds = new Set();
const nonMafiaChannelIds = new Set();
let announcedPath = null;

function getLogPath(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return path.join(logDir, `mafia-${day}.jsonl`);
}

async function isMafiaChannel(client, channelId) {
  if (mafiaChannelIds.has(channelId)) return true;
  if (nonMafiaChannelIds.has(channelId)) return false;
  if (!client?.channels) return false;

  const channel = client.channels.cache?.get(channelId) ||
    await client.channels.fetch(channelId).catch(() => null);

  if (channel?.name !== 'mafia') {
    nonMafiaChannelIds.add(channelId);
    return false;
  }

  mafiaChannelIds.add(channelId);
  return true;
}

function buildLogEntry(packet) {
  const data = packet.d || {};

  return {
    receivedAt: new Date().toISOString(),
    event: packet.t,
    sequence: packet.s,
    guildId: data.guild_id,
    channelId: data.channel_id,
    messageId: data.id,
    authorId: data.author?.id,
    authorUsername: data.author?.username,
    authorBot: data.author?.bot || false,
    content: data.content,
    embeds: data.embeds || [],
    attachments: data.attachments || [],
    mentions: data.mentions || [],
    mentionRoles: data.mention_roles || [],
    referencedMessage: data.referenced_message || null,
    raw: packet
  };
}

module.exports = {
  name: Events.Raw,

  async execute(packet, ...args) {
    try {
      if (packet?.t !== 'MESSAGE_CREATE') return;
      if (packet.d?.guild_id !== config.ids.guildId) return;
      if (!packet.d?.channel_id) return;

      const client = args.find((arg) => arg?.channels);
      const isMafia = await isMafiaChannel(client, packet.d.channel_id);
      if (!isMafia) return;

      const filePath = getLogPath();
      const entry = buildLogEntry(packet);

      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');

      if (announcedPath !== filePath) {
        announcedPath = filePath;
        logger.info(`Mafia raw message capture writing to ${filePath}`);
      }
    } catch (err) {
      logger.error('Mafia raw message capture skipped a packet', err);
    }
  }
};
