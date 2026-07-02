const config = require('../../config');
const { getAutoReacts } = require('../../utils/autoReact');

function isExplicitUserMention(content, userId) {
  const mentionRegex = new RegExp(`<@!?${userId}>`);
  return mentionRegex.test(content);
}

function keywordMatches(message, keyword) {
  if (/^\d{17,20}$/.test(keyword)) {
    return isExplicitUserMention(message.content, keyword);
  }

  return message.content.toLowerCase().includes(keyword);
}

function pickRandom(items, count) {
  if (items.length <= count) return items;

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}

module.exports = {
  name: 'autoreact',

  async execute(message, client) {
    if (message.guild?.id !== config.ids.guildId) return;
    if (!message.content) return;

    const autoReacts = await getAutoReacts(client, config.ids.guildId);
    if (!autoReacts?.length) return;

    const matchedReactions = new Set();
    const selfMatches = new Map();

    for (const entry of autoReacts) {
      if (!keywordMatches(message, entry.keyword)) continue;

      if (/^\d{17,20}$/.test(entry.keyword) && entry.createdBy === entry.keyword) {
        const reactions = selfMatches.get(entry.keyword) || [];
        reactions.push(entry.reaction);
        selfMatches.set(entry.keyword, reactions);
      } else {
        matchedReactions.add(entry.reaction);
      }
    }

    for (const reactions of selfMatches.values()) {
      for (const reaction of pickRandom(reactions, 2)) {
        matchedReactions.add(reaction);
      }
    }

    for (const reaction of matchedReactions) {
      await message.react(reaction).catch(() => {});
    }
  }
};
