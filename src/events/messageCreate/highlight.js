const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/models/highlight');

async function onMessage(message, client) {
  const highlightMap = client.state.highlights;
  if (!highlightMap || highlightMap.size === 0) return;

  const messageWords = message.content.toLowerCase().split(' ');
  const usersToNotify = new Map();

  for (const word of messageWords) {
    if (highlightMap.has(word)) {
      const users = highlightMap.get(word);
      for (const userId of users) {
        if (userId === message.author.id) continue;
        if (usersToNotify.has(userId)) {
          usersToNotify.get(userId).push(word);
        } else if (
          message.channel.permissionsFor(userId)?.has(PermissionFlagsBits.ViewChannel)
        ) {
          usersToNotify.set(userId, [word]);
        }
      }
    }
  }

  if (usersToNotify.size === 0) return;

  let prevMessages = await message.channel.messages.fetch({
    before: message.id,
    limit: 4
  });

  const fullContextRaw = [...prevMessages.values()].reverse();
  fullContextRaw.push(message);

  for (const [userId, keywords] of usersToNotify) {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) continue;

    const lastPing = client.state.lastHighlightPing?.get(userId) || 0;
    if (Date.now() - lastPing < 5 * 60 * 1000) continue;

    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

    const contextLog = fullContextRaw
      .map((msg) => {
        const unixTime = Math.floor(msg.createdTimestamp / 1000);
        const content = msg.content.replace(regex, '**__$&__**');
        return `[<t:${unixTime}:T>] ${msg.author.username}: ${content}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(keywords[0])
      .setDescription(contextLog)
      .setColor('#FFD700')
      .addFields([{ name: 'Source message', value: `[Jump to](${message.url})` }])
      .setFooter({ text: 'Triggered' })
      .setTimestamp();

    const notificationText = `In **${message.guild.name}** ${message.channel.toString()}, you were mentioned with highlight word "${keywords[0]}"`;

    try {
      await user.send({ content: notificationText, embeds: [embed] });
      client.state.lastHighlightPing.set(userId, Date.now());
    } catch (error) {
      if (error.code !== 50007) {
        console.error('Highlight notification error:', error);
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
  client.state.highlights = highlightMap;
  client.state.lastHighlightPing = new Map();
  console.log('Loaded highlights into memory.');
}

module.exports = {
  name: 'highlight',
  execute: onMessage,
  load: loadHighlights
};
