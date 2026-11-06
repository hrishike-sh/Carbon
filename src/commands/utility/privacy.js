const privacy = require('../../database/services/privacyService');
const LastPing = require('../../database/models/lastping');
const AFK = require('../../database/models/afk');
const logger = require('../../utils/logger');

function clearCachedMessages(client, userId) {
  for (const cache of Object.values(client.state.snipes)) {
    for (const [channelId, entries] of cache) {
      // Mutate in place so existing snipe collectors also lose these entries.
      for (let i = entries.length - 1; i >= 0; i--) {
        if ((entries[i].author?.id || entries[i].msg?.author?.id) === userId) entries.splice(i, 1);
      }
      if (!entries.length) cache.delete(channelId);
    }
  }
  client.state.counts.activeUsers.delete(userId);
  require('../../events/messageCreate/mafia').clearUserMessages(userId);
}

module.exports = {
  name: 'privacy',
  cooldown: 3,

  async execute(message, args, client) {
    const action = args[0]?.toLowerCase() || 'status';
    const userId = message.author.id;
    if (action === 'status') {
      return message.reply(`Message tracking is **${privacy.isOptedOut(userId) ? 'off' : 'on'}** for you. Use \`fh privacy optout\` to stop optional message tracking, or \`fh privacy optin\` to enable it again. Commands and replies you intentionally submit to games still work.`);
    }
    if (!['optout', 'optin'].includes(action)) {
      return message.reply('Use `fh privacy status`, `fh privacy optout`, or `fh privacy optin`.');
    }

    await privacy.setOptOut(userId, action === 'optout');
    if (action === 'optin') return message.reply('Optional message tracking is enabled again.');

    clearCachedMessages(client, userId);
    let cleanupFailed = false;
    try {
      await Promise.all([
        LastPing.updateMany({}, { $pull: { pings: { pingerId: userId } } }),
        LastPing.updateOne({ userId }, { $set: { pings: [] } }),
        AFK.updateMany({}, { $pull: { dms: { $or: [{ authorId: userId }, { tag: message.author.tag }] } } }),
        AFK.updateOne({ userId }, { $set: { dms: [] } })
      ]);
    } catch (err) {
      cleanupFailed = true;
      logger.error('Privacy opt-out history cleanup failed', err);
    }
    return message.reply(
      'Optional message tracking is now off for you across Carbon. Your messages will be excluded from highlights and their context, automatic keyword reactions, AFK/last-ping capture, snipe/edit-snipe capture, skullboard reposts, and new Mafia logs/transcripts. ' +
      'Commands and replies you intentionally submit to games are still processed. ' +
      (cleanupFailed ? 'Some stored AFK/last-ping history could not be cleared; run this command again or contact the bot operator. ' : 'Identifiable stored AFK/last-ping history and active message-history caches have been cleared for you. ') +
      'Previously sent notifications, Discord reposts, exported logs, and published transcripts are not automatically deleted; contact the bot operator for removal.'
    );
  }
};
