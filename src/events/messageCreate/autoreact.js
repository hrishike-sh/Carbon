const config = require('../../config');
const { getAutoReacts } = require('../../utils/autoReact');

function keywordMatches(message, keyword) {
  if (/^\d{17,20}$/.test(keyword)) {
    return message.mentions.users.has(keyword) || message.content.includes(keyword);
  }

  return message.content.toLowerCase().includes(keyword);
}

module.exports = {
  name: 'autoreact',

  async execute(message, client) {
    if (message.guild?.id !== config.ids.guildId) return;
    if (!message.content) return;

    const autoReacts = await getAutoReacts(client, config.ids.guildId);
    if (!autoReacts?.length) return;

    const matchedReactions = new Set();
    for (const entry of autoReacts) {
      if (keywordMatches(message, entry.keyword)) {
        matchedReactions.add(entry.reaction);
      }
    }

    for (const reaction of matchedReactions) {
      await message.react(reaction).catch(() => {});
    }
  }
};
