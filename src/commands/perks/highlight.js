const { EmbedBuilder } = require('discord.js');
const db = require('../../database/models/highlight');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

const MAX_HIGHLIGHTS = 25;
const MAX_HIGHLIGHT_LENGTH = 50;
const EXTRA_ALLOWED_ROLES = [
  '839803117646512128',
  '825283097830096908',
  '828048225096826890',
  '824687430753189902'
];

function normalizeHighlight(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function inlineCode(value) {
  return `\`${value.replace(/`/g, '\u02cb')}\``;
}

function compactReply(message, description, color = Theme.info) {
  return message.reply({
    embeds: [new EmbedBuilder().setColor(color).setDescription(description)]
  });
}

function usage(message) {
  return compactReply(
    message,
    '**Highlight commands**\n`fh hl add <word or phrase>` · `remove <highlight>` · `list`'
  );
}

module.exports = {
  name: 'highlight',
  aliases: ['hl'],
  cooldown: 2,
  roles: [
    config.roles.giveawayManager,
    config.roles.staff.mod,
    config.roles.staff.admin,
    ...EXTRA_ALLOWED_ROLES
  ],

  async execute(message, args, client) {
    const userId = message.author.id;
    const subcommand = args.shift()?.toLowerCase();

    if (!subcommand) return usage(message);

    if (subcommand === 'list' || subcommand === 'show') {
      const entry = await db.findOne({ userId });
      const highlights = entry?.highlights || [];

      if (highlights.length === 0) {
        return compactReply(
          message,
          'You have no highlights yet. Use `fh hl add <word or phrase>` to add one.'
        );
      }

      const list = highlights.map((highlight) => inlineCode(highlight)).join(' · ');
      return compactReply(
        message,
        `**Your highlights (${highlights.length}/${MAX_HIGHLIGHTS})**\n${list}`
      );
    }

    if (!['add', 'remove', 'delete', 'rm'].includes(subcommand)) return usage(message);

    const highlight = normalizeHighlight(args.join(' '));
    if (!highlight) return usage(message);

    if (highlight.length < 3) {
      return compactReply(message, 'Highlights must be at least 3 characters long.', Theme.error);
    }

    if (highlight.length > MAX_HIGHLIGHT_LENGTH) {
      return compactReply(
        message,
        `Highlights cannot be longer than ${MAX_HIGHLIGHT_LENGTH} characters.`,
        Theme.error
      );
    }

    let entry = await db.findOne({ userId });
    const storedMatch = entry?.highlights.find(
      (storedHighlight) => normalizeHighlight(storedHighlight) === highlight
    );

    if (subcommand === 'add') {
      if (storedMatch) {
        return compactReply(message, `${inlineCode(highlight)} is already in your highlights.`, Theme.error);
      }

      if (entry?.highlights.length >= MAX_HIGHLIGHTS) {
        return compactReply(
          message,
          `You can have up to ${MAX_HIGHLIGHTS} highlights. Remove one before adding another.`,
          Theme.error
        );
      }

      if (entry) {
        entry.highlights.push(highlight);
        await entry.save();
      } else {
        entry = await db.create({ userId, highlights: [highlight] });
      }

      if (!client.state.highlights) client.state.highlights = new Map();
      const subscribers = client.state.highlights.get(highlight) || [];
      if (!subscribers.includes(userId)) subscribers.push(userId);
      client.state.highlights.set(highlight, subscribers);

      return compactReply(message, `Added ${inlineCode(highlight)} to your highlights.`, Theme.success);
    }

    if (!storedMatch) {
      return compactReply(
        message,
        `${inlineCode(highlight)} is not in your highlights. Use \`fh hl list\` to check them.`,
        Theme.error
      );
    }

    entry.highlights = entry.highlights.filter(
      (storedHighlight) => normalizeHighlight(storedHighlight) !== highlight
    );

    if (entry.highlights.length === 0) {
      await entry.deleteOne();
    } else {
      await entry.save();
    }

    const subscribers = client.state.highlights?.get(highlight) || [];
    const remainingSubscribers = subscribers.filter((subscriberId) => subscriberId !== userId);
    if (remainingSubscribers.length > 0) {
      client.state.highlights.set(highlight, remainingSubscribers);
    } else {
      client.state.highlights?.delete(highlight);
    }

    return compactReply(message, `Removed ${inlineCode(highlight)} from your highlights.`, Theme.success);
  }
};
