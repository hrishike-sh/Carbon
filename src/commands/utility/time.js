const Timezone = require('../../database/models/timezone');

const PROMPT_TIMEOUT_MS = 60000;
const MAX_SUGGESTIONS = 5;
const AUTO_MATCH_SCORE = 0.3;
const AUTO_MATCH_MARGIN = 0.1;
const COMMON_ALIASES = new Map([
  ['bangalore', 'Asia/Calcutta'],
  ['bengaluru', 'Asia/Calcutta'],
  ['bombay', 'Asia/Calcutta'],
  ['calcutta', 'Asia/Calcutta'],
  ['chennai', 'Asia/Calcutta'],
  ['delhi', 'Asia/Calcutta'],
  ['hyderabad', 'Asia/Calcutta'],
  ['india', 'Asia/Calcutta'],
  ['indianstandardtime', 'Asia/Calcutta'],
  ['kolkata', 'Asia/Calcutta'],
  ['mumbai', 'Asia/Calcutta'],
  ['newdelhi', 'Asia/Calcutta'],
  ['gmt', 'UTC'],
  ['utc', 'UTC'],
  ['zulu', 'UTC'],
  ['la', 'America/Los_Angeles'],
  ['losangeles', 'America/Los_Angeles'],
  ['sf', 'America/Los_Angeles'],
  ['sanfrancisco', 'America/Los_Angeles'],
  ['nyc', 'America/New_York'],
  ['newyork', 'America/New_York'],
  ['uk', 'Europe/London'],
  ['britain', 'Europe/London'],
  ['england', 'Europe/London'],
  ['london', 'Europe/London'],
  ['france', 'Europe/Paris'],
  ['paris', 'Europe/Paris'],
  ['japan', 'Asia/Tokyo'],
  ['tokyo', 'Asia/Tokyo'],
  ['korea', 'Asia/Seoul'],
  ['seoul', 'Asia/Seoul'],
  ['uae', 'Asia/Dubai'],
  ['dubai', 'Asia/Dubai'],
  ['singapore', 'Asia/Singapore'],
  ['sydney', 'Australia/Sydney'],
  ['melbourne', 'Australia/Melbourne'],
  ['toronto', 'America/Toronto'],
  ['chicago', 'America/Chicago']
]);
const AMBIGUOUS_ALIASES = new Map([
  ['ist', ['Asia/Calcutta', 'Europe/Dublin', 'Asia/Jerusalem']],
  ['est', ['America/New_York', 'Australia/Brisbane', 'Australia/Sydney']],
  ['cst', ['America/Chicago', 'Asia/Shanghai', 'America/Mexico_City']],
  ['mst', ['America/Denver', 'America/Phoenix']],
  ['pst', ['America/Los_Angeles', 'Asia/Manila']]
]);
let supportedTimezones;

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function getSupportedTimezones() {
  if (supportedTimezones) return supportedTimezones;

  const zones = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [];

  supportedTimezones = Array.from(new Set(['UTC', ...zones])).sort();
  return supportedTimezones;
}

function resolveExactTimezone(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch (err) {
    return null;
  }
}

function getTimezoneTerms(timezone) {
  const readable = timezone.replace(/_/g, ' ');
  const parts = readable.split('/');
  const place = parts[parts.length - 1];
  const withoutRegion = parts.slice(1).join(' ');

  return Array.from(new Set([
    timezone,
    readable,
    place,
    withoutRegion
  ].filter(Boolean)));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j <= b.length; j++) previous[j] = current[j];
  }

  return previous[b.length];
}

function scoreTerm(query, term) {
  const normalizedTerm = normalizeSearch(term);
  if (!query || !normalizedTerm) return 1;
  if (query === normalizedTerm) return 0;

  if (query.length >= 3) {
    if (normalizedTerm.startsWith(query)) {
      return 0.08 + ((normalizedTerm.length - query.length) / 100);
    }

    if (normalizedTerm.includes(query)) {
      return 0.15 + ((normalizedTerm.length - query.length) / 100);
    }
  }

  const distance = levenshtein(query, normalizedTerm);
  return distance / Math.max(query.length, normalizedTerm.length);
}

function findTimezoneMatches(input) {
  const query = normalizeSearch(input);
  if (!query) return [];

  return getSupportedTimezones()
    .map((timezone) => ({
      timezone,
      score: Math.min(...getTimezoneTerms(timezone).map((term) => scoreTerm(query, term)))
    }))
    .sort((a, b) => a.score - b.score || a.timezone.localeCompare(b.timezone));
}

function resolveTimezone(input) {
  const query = normalizeSearch(input);
  const ambiguousSuggestions = AMBIGUOUS_ALIASES.get(query);
  if (ambiguousSuggestions) {
    return { timezone: null, suggestions: ambiguousSuggestions };
  }

  const alias = COMMON_ALIASES.get(query);
  if (alias) return { timezone: alias, suggestions: [] };

  const exact = resolveExactTimezone(input);
  if (exact) return { timezone: exact, suggestions: [] };

  const matches = findTimezoneMatches(input);
  const suggestions = matches.slice(0, MAX_SUGGESTIONS).map((match) => match.timezone);
  const [best, second] = matches;

  if (
    best &&
    best.score <= AUTO_MATCH_SCORE &&
    (!second || second.score - best.score >= AUTO_MATCH_MARGIN)
  ) {
    return { timezone: best.timezone, suggestions };
  }

  return { timezone: null, suggestions };
}

function formatTimezoneError(suggestions) {
  if (suggestions?.length) {
    return [
      'I could not confidently pick a timezone. Did you mean one of these?',
      suggestions.map((timezone) => `\`${timezone}\``).join(', '),
      'Use `fh time set <timezone>` with one of those.'
    ].join('\n');
  }

  return 'That timezone was not recognized. Try an IANA name like `Asia/Calcutta`, or a city like `London`.';
}

function getTimeZonePart(date, timeZone, timeZoneName) {
  return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
}

function getTimezoneAbbreviation(date, timeZone) {
  const shortName = getTimeZonePart(date, timeZone, 'short');
  if (shortName && !shortName.startsWith('GMT')) return shortName;

  const longName = getTimeZonePart(date, timeZone, 'long');
  if (!longName) return shortName || 'UTC';
  if (longName.startsWith('GMT')) return shortName || longName;

  return longName
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .map((word) => word[0].toUpperCase())
    .join('') || shortName || 'UTC';
}

function getParts(date, timeZone, options) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, ...options })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
}

function getOffsetMinutes(date, timeZone) {
  const parts = getParts(date, timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const mins = String(absolute % 60).padStart(2, '0');
  return `${sign}${hours}${mins}`;
}

function formatTimeMessage(user, timezone) {
  const now = new Date();
  const timeParts = getParts(now, timezone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const dateParts = getParts(now, timezone, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const abbreviation = getTimezoneAbbreviation(now, timezone);
  const offset = formatOffset(getOffsetMinutes(now, timezone));
  const unix = Math.floor(now.getTime() / 1000);

  return [
    `${user.username}'s current timezone is: **${timezone}**`,
    `The current time is: **${timeParts.hour}:${timeParts.minute} ${timeParts.dayPeriod}** ${dateParts.day}-${dateParts.month}-${dateParts.year} **${abbreviation} (UTC ${offset})**`,
    `<t:${unix}>`
  ].join('\n');
}

async function saveTimezone(userId, timezone) {
  return Timezone.findOneAndUpdate(
    { userId },
    { userId, timezone, updatedAt: Date.now() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function promptForTimezone(message) {
  await message.reply(
    'You do not have a timezone set yet. Reply with your IANA timezone, like `Asia/Calcutta`, `Europe/London`, or `America/New_York`.'
  );

  const collected = await message.channel.awaitMessages({
    filter: (reply) => reply.author.id === message.author.id && !reply.author.bot,
    max: 1,
    time: PROMPT_TIMEOUT_MS
  }).catch(() => null);

  const reply = collected?.first();
  if (!reply) {
    return message.reply('Timezone setup timed out. Try again with `fh time set Asia/Calcutta`.');
  }

  const content = reply.content.trim();
  if (/^(cancel|stop)$/i.test(content)) {
    return message.reply('Timezone setup cancelled.');
  }

  const { timezone, suggestions } = resolveTimezone(content);
  if (!timezone) {
    return message.reply(formatTimezoneError(suggestions));
  }

  await saveTimezone(message.author.id, timezone);
  return message.reply(formatTimeMessage(message.author, timezone));
}

module.exports = {
  name: 'time',
  aliases: ['tz', 'timezone'],
  cooldown: 3,

  async execute(message, args, client) {
    const mentionedUser = message.mentions.users.first();

    if (mentionedUser) {
      const entry = await Timezone.findOne({ userId: mentionedUser.id });
      if (!entry) {
        return message.reply(`${mentionedUser.username} has not set a timezone yet.`);
      }

      return message.reply(formatTimeMessage(mentionedUser, entry.timezone));
    }

    if (args[0]?.toLowerCase() === 'clear' || args[0]?.toLowerCase() === 'remove') {
      await Timezone.deleteOne({ userId: message.author.id });
      return message.reply('Your timezone has been cleared.');
    }

    const rawTimezone = args[0]?.toLowerCase() === 'set'
      ? args.slice(1).join(' ')
      : args.join(' ');

    if (rawTimezone) {
      const { timezone, suggestions } = resolveTimezone(rawTimezone);
      if (!timezone) {
        return message.reply(formatTimezoneError(suggestions));
      }

      await saveTimezone(message.author.id, timezone);
      return message.reply(formatTimeMessage(message.author, timezone));
    }

    const entry = await Timezone.findOne({ userId: message.author.id });
    if (!entry) {
      return promptForTimezone(message);
    }

    return message.reply(formatTimeMessage(message.author, entry.timezone));
  }
};
