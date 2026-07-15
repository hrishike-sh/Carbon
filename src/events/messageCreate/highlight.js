const { PermissionFlagsBits } = require('discord.js');
const db = require('../../database/models/highlight');
const { warningEmbed } = require('../../utils/embeds');

const NOTIFICATION_COOLDOWN = 5 * 60 * 1000;
const CONTEXT_MESSAGE_LIMIT = 2;
const CONTEXT_CONTENT_LIMIT = 600;

function normalizeHighlight(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightRegex(keywords, flags = 'giu') {
  const alternatives = keywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');

  return new RegExp(`(?<![\\p{L}\\p{N}_])(${alternatives})(?![\\p{L}\\p{N}_])`, flags);
}

function truncate(content, maxLength) {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength - 1)}…`;
}

async function onMessage(message, client) {
  const highlightMap = client.state.highlights;
  if (!message.content || !highlightMap || highlightMap.size === 0) return;

  const usersToNotify = new Map();

  for (const [keyword, subscribers] of highlightMap) {
    if (!highlightRegex([keyword]).test(message.content)) continue;

    for (const userId of subscribers) {
      if (userId === message.author.id) continue;
      if (!message.channel.permissionsFor(userId)?.has(PermissionFlagsBits.ViewChannel)) continue;

      const matchedKeywords = usersToNotify.get(userId) || new Set();
      matchedKeywords.add(keyword);
      usersToNotify.set(userId, matchedKeywords);
    }
  }

  if (usersToNotify.size === 0) return;

  const previousMessages = await message.channel.messages.fetch({
    before: message.id,
    limit: CONTEXT_MESSAGE_LIMIT
  });
  const contextMessages = [...previousMessages.values()].reverse().concat(message);

  for (const [userId, keywordSet] of usersToNotify) {
    const lastPing = client.state.lastHighlightPing?.get(userId) || 0;
    if (Date.now() - lastPing < NOTIFICATION_COOLDOWN) continue;

    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) continue;

    const keywords = [...keywordSet];
    const matchRegex = highlightRegex(keywords);
    const contextLog = contextMessages
      .map((contextMessage) => {
        const unixTime = Math.floor(contextMessage.createdTimestamp / 1000);
        const rawContent = contextMessage.content || (contextMessage.attachments.size ? '[attachment]' : '[no text]');
        const content = truncate(rawContent, CONTEXT_CONTENT_LIMIT).replace(matchRegex, '**$1**');
        return `<t:${unixTime}:T> **${contextMessage.author.username}:** ${content}`;
      })
      .join('\n');

    const matched = keywords.map((keyword) => `\`${keyword.replace(/`/g, '\u02cb')}\``).join(', ');
    const embed = warningEmbed({
      description:
        `**${message.guild.name} · ${message.channel}**\n` +
        `Matched ${matched} · [Jump to message](${message.url})\n\n${contextLog}`
    });

    try {
      await user.send({ embeds: [embed] });
      if (!client.state.lastHighlightPing) client.state.lastHighlightPing = new Map();
      client.state.lastHighlightPing.set(userId, Date.now());
    } catch (error) {
      if (error.code !== 50007) console.error('Highlight notification error:', error);
    }
  }
}

async function loadHighlights(client) {
  const entries = await db.find();
  const highlightMap = new Map();

  for (const entry of entries) {
    for (const storedKeyword of entry.highlights) {
      const keyword = normalizeHighlight(storedKeyword);
      if (!keyword) continue;

      const subscribers = highlightMap.get(keyword) || [];
      if (!subscribers.includes(entry.userId)) subscribers.push(entry.userId);
      highlightMap.set(keyword, subscribers);
    }
  }

  client.state.highlights = highlightMap;
  client.state.lastHighlightPing = new Map();
  console.log('Loaded highlights into memory.');
}

module.exports = {
  name: 'highlight',
  execute: onMessage,
  load: loadHighlights
};
