const CommandStats = require('../models/commandStats');
const logger = require('../../utils/logger');

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
}

function startOfUtcWeek(date = new Date()) {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay() || 7;
  return addDays(day, 1 - weekday);
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function formatWeekKey(date) {
  return `Week of ${toDateKey(date)}`;
}

function getBuckets(period, now = new Date()) {
  if (period === 'monthly') {
    const end = startOfUtcMonth(now);
    return Array.from({ length: 12 }, (_, index) => {
      const start = addMonths(end, index - 11);
      return {
        key: monthKey(start),
        label: monthKey(start),
        start,
        end: addMonths(start, 1)
      };
    });
  }

  if (period === 'weekly') {
    const end = startOfUtcWeek(now);
    return Array.from({ length: 8 }, (_, index) => {
      const start = addDays(end, (index - 7) * 7);
      return {
        key: toDateKey(start),
        label: formatWeekKey(start),
        start,
        end: addDays(start, 7)
      };
    });
  }

  const end = startOfUtcDay(now);
  return Array.from({ length: 14 }, (_, index) => {
    const start = addDays(end, index - 13);
    return {
      key: toDateKey(start),
      label: toDateKey(start).slice(5),
      start,
      end: addDays(start, 1)
    };
  });
}

function normaliseCommandName(commandName) {
  return String(commandName || '').trim().toLowerCase();
}

class CommandStatsService {
  async track({ guildId, commandName, commandType }) {
    const name = normaliseCommandName(commandName);
    if (!guildId || !name || !commandType) return;

    await CommandStats.updateOne(
      {
        guildId,
        commandName: name,
        commandType,
        dateKey: toDateKey()
      },
      { $inc: { uses: 1 } },
      { upsert: true }
    ).catch((err) => {
      logger.error(`Failed to track command stat for ${name}`, err);
    });
  }

  async getUsage({ guildId, period = 'daily', commandName = null }) {
    const buckets = getBuckets(period);
    const startKey = toDateKey(buckets[0].start);
    const query = {
      guildId,
      dateKey: { $gte: startKey }
    };

    const normalisedCommand = normaliseCommandName(commandName);
    if (normalisedCommand) query.commandName = normalisedCommand;

    const docs = await CommandStats.find(query).lean();
    const totalsByBucket = new Map(buckets.map((bucket) => [bucket.key, 0]));
    const totalsByCommand = new Map();
    let prefixTotal = 0;
    let slashTotal = 0;

    for (const doc of docs) {
      const docDate = fromDateKey(doc.dateKey);
      const bucket = buckets.find((item) => docDate >= item.start && docDate < item.end);
      if (!bucket) continue;

      totalsByBucket.set(bucket.key, totalsByBucket.get(bucket.key) + doc.uses);
      totalsByCommand.set(
        doc.commandName,
        (totalsByCommand.get(doc.commandName) || 0) + doc.uses
      );

      if (doc.commandType === 'slash') slashTotal += doc.uses;
      else prefixTotal += doc.uses;
    }

    return {
      period,
      commandName: normalisedCommand,
      buckets: buckets.map((bucket) => ({
        label: bucket.label,
        value: totalsByBucket.get(bucket.key) || 0
      })),
      total: prefixTotal + slashTotal,
      prefixTotal,
      slashTotal,
      topCommands: [...totalsByCommand.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, uses]) => ({ name, uses }))
    };
  }
}

module.exports = {
  CommandStatsService: new CommandStatsService(),
  getBuckets,
  toDateKey
};
