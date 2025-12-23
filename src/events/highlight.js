const { Message, Client, EmbedBuilder } = require('discord.js');
const db = require('../database/highlight');

/**
 *
 * @param {Message} message
 * @param {Client} client
 */
async function onMessage(message, client) {
  if (message.author.bot || !message.guild) return;

  const highlightMap = client.db.highlights;
  if (!highlightMap || highlightMap.size === 0) return;

  const messageWords = message.content.toLowerCase().split(' ');
  const usersToNotify = new Set();

  for (const word of messageWords) {
    if (highlightMap.has(word)) {
      const users = highlightMap.get(word);
      for (const userId of users) {
        if (userId === message.author.id) continue;
        usersToNotify.add(userId);
      }
    }
  }

  if (usersToNotify.size === 0) return;

  let prevMessages = await message.channel.messages.fetch({
    before: message.id,
    limit: 4
  });
  prevMessages = [...prevMessages.values()].reverse();
  const context =
    prevMessages
      .map((m) => `**${m.author.tag}**: ${m.content}`)
      .join('\n') || 'No previous messages found.';

  for (const userId of usersToNotify) {
    const user = await client.users.fetch(userId);
    if (!user) continue;

    const lastPing = client.db.lastHighlightPing.get(userId) || 0;
    if (Date.now() - lastPing < 5 * 60 * 1000) continue;

    const embed = new EmbedBuilder()
      .setTitle('New Highlight!')
      .setDescription(
        `You were mentioned in ${message.channel.toString()} by ${
          message.author.tag
        }`
      )
      .addFields([
        {
          name: 'Context',
          value: context
        },
        {
          name: 'Message',
          value: `[${message.content}](${message.url})`
        }
      ])
      .setTimestamp()
      .setColor('Green');
    try {
      await user.send({ embeds: [embed] });
      client.db.lastHighlightPing.set(userId, Date.now());
    } catch (error) {
      if (error.code === 50007) {
        // Cannot send messages to this user
        // Maybe disable highlights for them?
      }
    }
  }
}

async function loadHighlights(client) {
  const highlights = await db.find();
  const highlightMap = new Map();
  for (const hl of highlights) {
    for (const keyword of hl.highlights) {
      if (highlightMap.has(keyword)) {
        highlightMap.get(keyword).push(hl.userId);
      } else {
        highlightMap.set(keyword, [hl.userId]);
      }
    }
  }
  client.db.highlights = highlightMap;
  client.db.lastHighlightPing = new Map();
  console.log('Loaded highlights into memory.');
}

module.exports = {
  name: 'messageCreate',
  execute: onMessage,
  load: loadHighlights
};
