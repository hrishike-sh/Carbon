const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const Database = require('../database/models/skullboard');
const { Theme } = require('./embeds');
const logger = require('./logger');

const pendingUpdates = new Map();
const THRESHOLD = 10;

async function fetchBoardMessage(channel, id) {
  if (!id) return null;
  return channel.messages.fetch(id).catch((error) => {
    if (error.code === 10008) return null;
    throw error;
  });
}

async function updateBoard(reaction) {
  const fetched = await reaction.fetch();
  const message = fetched.message.partial ? await fetched.message.fetch() : fetched.message;
  const channel = message.guild.channels.cache.get(config.ids.channels.skullboard);
  if (!channel?.isTextBased()) return;

  let entry = await Database.findOne({ 'originalMessage.id': message.id });
  if (fetched.count < THRESHOLD && !entry) return;
  const existing = await fetchBoardMessage(channel, entry?.skullboardMessage?.id);

  if (fetched.count < THRESHOLD) {
    if (existing) {
      await existing.delete().catch((error) => {
        if (error.code !== 10008) throw error;
      });
    }
    await entry.deleteOne();
    return;
  }

  const embed = {
    author: { name: message.author.tag, iconURL: message.author.displayAvatarURL() },
    title: `${fetched.count.toLocaleString()} :skull:`,
    description: (message.content || '_ _').slice(0, 4096),
    color: Theme.warning
  };
  const attachment = message.attachments?.first();
  if (attachment) embed.image = { url: attachment.url };
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji('💀').setURL(message.url)
  );
  const payload = { embeds: [embed], components: [row] };
  if (existing) {
    await existing.edit(payload);
    return;
  }

  entry ??= new Database({
    originalMessage: { channelId: message.channel.id, id: message.id },
    user: { id: message.author.id }
  });
  const posted = await channel.send(payload);
  try {
    entry.skullboardMessage = { id: posted.id };
    await entry.save();
  } catch (error) {
    await posted.delete().catch(() => {});
    throw error;
  }
}

async function syncSkullboard(reaction, added = false) {
  const message = reaction.message;
  if (message.guild?.id !== config.ids.guildId || reaction.emoji?.name !== '💀') return;
  if (added && !reaction.partial && reaction.count < THRESHOLD && !pendingUpdates.has(message.id)) return;

  const pending = pendingUpdates.get(message.id);
  if (pending) {
    pending.reaction = reaction;
    return pending.promise;
  }

  // Add and remove events share one queue. Coalesce bursts while retaining a
  // final refresh so an update arriving during a REST call is never dropped.
  const state = { reaction, promise: null };
  pendingUpdates.set(message.id, state);
  state.promise = (async () => {
    try {
      while (state.reaction) {
        const next = state.reaction;
        state.reaction = null;
        try {
          await updateBoard(next);
        } catch (error) {
          if (error.code !== 10008) logger.error('Skullboard update failed', error);
        }
      }
    } finally {
      pendingUpdates.delete(message.id);
    }
  })();
  return state.promise;
}

module.exports = { syncSkullboard };
