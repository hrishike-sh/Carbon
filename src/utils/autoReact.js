const AutoReact = require('../database/models/autoreact');

function getKeywordFromArg(arg) {
  const raw = String(arg || '').trim();
  const userMention = raw.match(/^<@!?(\d{17,20})>$/);
  if (userMention) return userMention[1];
  return raw.toLowerCase();
}

function displayKeyword(keyword) {
  if (/^\d{17,20}$/.test(keyword)) return `<@${keyword}>`;
  return `\`${keyword}\``;
}

function getEmojiId(reaction) {
  return String(reaction || '').match(/^<a?:\w+:(\d{17,20})>$/)?.[1] || null;
}

function normalizeReaction(reaction, client) {
  const raw = String(reaction || '').trim();
  if (!raw) return null;

  const customId = getEmojiId(raw);
  if (customId) {
    const emoji = client.emojis.cache.get(customId);
    return emoji?.toString() || null;
  }

  if (/^\d{17,20}$/.test(raw)) {
    const emoji = client.emojis.cache.get(raw);
    return emoji?.toString() || null;
  }

  return raw;
}

function displayReaction(reaction) {
  const customId = getEmojiId(reaction);
  if (customId) return reaction;
  return `${reaction}`;
}

async function loadAutoReacts(client, guildId) {
  const entries = await AutoReact.find({ guildId }).sort({ keyword: 1 });
  if (!client.state.autoReacts) client.state.autoReacts = new Map();
  client.state.autoReacts.set(guildId, entries.map((entry) => ({
    keyword: entry.keyword,
    reaction: entry.reaction
  })));
  return client.state.autoReacts.get(guildId);
}

async function getAutoReacts(client, guildId) {
  if (!client.state.autoReacts?.has(guildId)) {
    return loadAutoReacts(client, guildId);
  }

  return client.state.autoReacts.get(guildId);
}

module.exports = {
  AutoReact,
  displayKeyword,
  displayReaction,
  getAutoReacts,
  getKeywordFromArg,
  loadAutoReacts,
  normalizeReaction
};
