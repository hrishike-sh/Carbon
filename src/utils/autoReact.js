const AutoReact = require('../database/models/autoreact');

let indexesReady = false;

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

function parseCustomEmoji(reaction) {
  const match = String(reaction || '').trim().match(/^<(a?):([A-Za-z0-9_]{2,32}):(\d{17,20})>$/);
  if (!match) return null;

  return {
    animated: Boolean(match[1]),
    name: match[2],
    id: match[3]
  };
}

function normalizeReaction(reaction, client) {
  const raw = String(reaction || '').trim();
  if (!raw) return null;

  const customEmoji = parseCustomEmoji(raw);
  if (customEmoji) {
    const emoji = client.emojis.cache.get(customEmoji.id);
    return emoji?.toString() || raw;
  }

  if (/^\d{17,20}$/.test(raw)) {
    const customId = raw;
    const emoji = client.emojis.cache.get(customId);
    return emoji?.toString() || null;
  }

  return raw;
}

function displayReaction(reaction) {
  const customId = getEmojiId(reaction);
  if (customId) return reaction;
  return `${reaction}`;
}

async function ensureAutoReactIndexes() {
  if (indexesReady) return;

  const indexes = await AutoReact.collection.indexes().catch(() => []);
  const legacyIndex = indexes.find((index) => (
    index.unique &&
    index.key?.guildId === 1 &&
    index.key?.keyword === 1 &&
    !index.key?.reaction
  ));

  if (legacyIndex) {
    await AutoReact.collection.dropIndex(legacyIndex.name).catch(() => {});
  }

  await AutoReact.collection.createIndex(
    { guildId: 1, keyword: 1, reaction: 1 },
    { unique: true }
  ).catch(() => {});

  indexesReady = true;
}

function makeApplicationEmojiName(name, id) {
  const suffix = `_${id.slice(-6)}`;
  const clean = String(name || 'emoji')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32 - suffix.length);

  const base = clean.length >= 2 ? clean : 'ar';
  return `${base}${suffix}`.slice(0, 32);
}

async function importApplicationEmoji(reaction, client) {
  const parsed = parseCustomEmoji(reaction);
  if (!parsed) return null;

  const application = client.application || await client.application?.fetch?.().catch(() => null);
  if (!application?.emojis) return null;

  const name = makeApplicationEmojiName(parsed.name, parsed.id);
  const existing = await application.emojis.fetch().catch(() => null);
  const existingEmojis = existing?.values ? Array.from(existing.values()) : [];
  const alreadyImported = existingEmojis.find((emoji) => emoji.name === name);
  if (alreadyImported) {
    return {
      emoji: alreadyImported,
      reaction: alreadyImported.toString(),
      imported: false
    };
  }

  const extension = parsed.animated ? 'gif' : 'png';
  const attachment = `https://cdn.discordapp.com/emojis/${parsed.id}.${extension}?quality=lossless`;
  const emoji = await application.emojis.create({ attachment, name });

  return {
    emoji,
    reaction: emoji.toString(),
    imported: true
  };
}

async function loadAutoReacts(client, guildId) {
  await ensureAutoReactIndexes();
  const entries = await AutoReact.find({ guildId }).sort({ keyword: 1, reaction: 1 });
  if (!client.state.autoReacts) client.state.autoReacts = new Map();
  client.state.autoReacts.set(guildId, entries.map((entry) => ({
    keyword: entry.keyword,
    reaction: entry.reaction,
    createdBy: entry.createdBy
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
  ensureAutoReactIndexes,
  getAutoReacts,
  getKeywordFromArg,
  importApplicationEmoji,
  loadAutoReacts,
  normalizeReaction
};
