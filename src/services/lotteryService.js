const crypto = require('crypto');
const { EmbedBuilder } = require('discord.js');
const LotteryRound = require('../database/models/lotteryRound');
const config = require('../config');
const logger = require('../utils/logger');
const { Theme } = require('../utils/embeds');

const DANK_MEMER_ID = '270904126974590976';
const TICKET_PRICE = 100_000;
const PRIZE_PERCENT = 0.95;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const LOTTERY_CHANNEL_ID = config.ids.channels.lottery;

let schedulerStarted = false;
let tickRunning = false;

function nextDrawAt(now = new Date()) {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istBoundary = new Date(istNow);

  istBoundary.setUTCMinutes(0, 0, 0);
  istBoundary.setUTCHours(istNow.getUTCHours() < 12 ? 12 : 24);

  return new Date(istBoundary.getTime() - IST_OFFSET_MS);
}

function componentText(components) {
  const text = [];

  for (const component of components || []) {
    const content = component.content ?? component.data?.content;
    if (typeof content === 'string') text.push(content);

    const children = component.components ?? component.data?.components;
    if (children?.length) text.push(componentText(children));
  }

  return text.filter(Boolean).join('\n');
}

function parseDonationMessage(message) {
  if (message.channelId !== LOTTERY_CHANNEL_ID) return null;
  if (message.author?.id !== DANK_MEMER_ID) return null;

  const commandName = message.interaction?.commandName;
  if (commandName && commandName.toLowerCase() !== 'serverevents donate') {
    return null;
  }

  const donor = message.interactionMetadata?.user || message.interaction?.user;
  if (!donor || donor.bot) return null;

  const text = [message.content, componentText(message.components)]
    .filter(Boolean)
    .join('\n');
  const match = text.match(
    /Successfully donated\s+\*\*\s*\u23e3\s*([\d,]+)\s*\*\*/iu
  );
  if (!match) return null;

  const amount = Number(match[1].replaceAll(',', ''));
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;

  return {
    messageId: message.id,
    guildId: message.guildId,
    channelId: message.channelId,
    userId: donor.id,
    amount
  };
}

async function ensureActiveRound(now = new Date()) {
  const existing = await LotteryRound.findOne({
    activeKey: LOTTERY_CHANNEL_ID,
    status: 'active'
  });
  if (existing) return existing;

  try {
    return await LotteryRound.create({
      guildId: config.ids.guildId,
      channelId: LOTTERY_CHANNEL_ID,
      activeKey: LOTTERY_CHANNEL_ID,
      status: 'active',
      startedAt: now,
      scheduledDrawAt: nextDrawAt(now)
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;

    return LotteryRound.findOne({
      activeKey: LOTTERY_CHANNEL_ID,
      status: 'active'
    });
  }
}

async function recordDonation(donation) {
  const alreadyProcessed = await LotteryRound.exists({
    processedMessageIds: donation.messageId
  });
  if (alreadyProcessed) return { recorded: false, duplicate: true };

  let round = await ensureActiveRound();

  for (let attempt = 0; attempt < 2; attempt++) {
    if (!round) {
      round = await ensureActiveRound();
      continue;
    }

    const updated = await LotteryRound.findOneAndUpdate(
      {
        _id: round._id,
        status: 'active',
        processedMessageIds: { $ne: donation.messageId }
      },
      {
        $inc: {
          totalPool: donation.amount,
          [`donationsByUser.${donation.userId}`]: donation.amount
        },
        $push: { processedMessageIds: donation.messageId }
      },
      { new: true }
    );

    if (updated) {
      const userTotal = updated.donationsByUser.get(donation.userId) || 0;
      const previousTotal = userTotal - donation.amount;

      return {
        recorded: true,
        roundId: updated.id,
        amount: donation.amount,
        userTotal,
        ticketsAdded:
          Math.floor(userTotal / TICKET_PRICE) -
          Math.floor(previousTotal / TICKET_PRICE)
      };
    }

    const previousRound = await LotteryRound.findById(round._id)
      .select('processedMessageIds')
      .lean();
    if (previousRound?.processedMessageIds?.includes(donation.messageId)) {
      return { recorded: false, duplicate: true };
    }

    round = await ensureActiveRound();
  }

  throw new Error('Could not find an active lottery round for the donation');
}

async function processDonationEdit(message) {
  const donation = parseDonationMessage(message);
  if (!donation) return null;

  const result = await recordDonation(donation);
  if (result?.recorded) {
    logger.info(
      `Lottery donation: ${donation.userId} donated ${donation.amount.toLocaleString()} ` +
        `(${result.ticketsAdded} new ticket(s))`
    );
  }

  return result;
}

function entriesForRound(round) {
  const donations =
    round.donationsByUser instanceof Map
      ? [...round.donationsByUser.entries()]
      : Object.entries(round.donationsByUser || {});

  return donations
    .map(([userId, donated]) => ({
      userId,
      donated: Number(donated) || 0,
      tickets: Math.floor((Number(donated) || 0) / TICKET_PRICE)
    }))
    .sort((a, b) => b.tickets - a.tickets || b.donated - a.donated);
}

function randomTicket(totalTickets) {
  if (totalTickets <= 0) return null;
  if (totalTickets <= 2 ** 48 - 1) return crypto.randomInt(totalTickets);
  return Math.floor(Math.random() * totalTickets);
}

function pickWinner(entries) {
  const totalTickets = entries.reduce((sum, entry) => sum + entry.tickets, 0);
  const ticket = randomTicket(totalTickets);
  if (ticket === null) return { winner: null, totalTickets };

  let cursor = 0;
  for (const entry of entries) {
    cursor += entry.tickets;
    if (ticket < cursor) return { winner: entry, totalTickets };
  }

  return { winner: null, totalTickets };
}

async function prepareDrawing(round) {
  const entries = entriesForRound(round);
  const { winner, totalTickets } = pickWinner(entries);
  const prizeAmount = Math.floor(round.totalPool * PRIZE_PERCENT);

  return LotteryRound.findOneAndUpdate(
    { _id: round._id, status: 'drawing' },
    {
      $set: {
        status: 'announcing',
        drawnAt: new Date(),
        totalTickets,
        winnerId: winner?.userId,
        winnerTickets: winner?.tickets || 0,
        prizeAmount
      }
    },
    { new: true }
  );
}

async function announceDrawing(client, round) {
  const channel =
    client.channels.cache.get(round.channelId) ||
    (await client.channels.fetch(round.channelId));
  if (!channel?.isTextBased()) {
    throw new Error(`Lottery channel ${round.channelId} is not text based`);
  }

  const embed = new EmbedBuilder()
    .setColor(round.winnerId ? Theme.success : Theme.warning)
    .setTitle(round.winnerId ? 'Lottery Winner!' : 'Lottery Draw Ended')
    .setTimestamp(round.drawnAt || new Date())
    .addFields(
      {
        name: 'Total Pool',
        value: `\u23e3 ${round.totalPool.toLocaleString()}`,
        inline: true
      },
      {
        name: 'Total Tickets',
        value: round.totalTickets.toLocaleString(),
        inline: true
      }
    );

  if (round.winnerId) {
    const chance = (round.winnerTickets / round.totalTickets) * 100;
    embed
      .setDescription(
        `Congratulations <@${round.winnerId}>! You won **\u23e3 ${round.prizeAmount.toLocaleString()}** ` +
          `(95% of the pool).`
      )
      .addFields(
        {
          name: 'Winner Tickets',
          value: round.winnerTickets.toLocaleString(),
          inline: true
        },
        {
          name: 'Winning Chance',
          value: `${formatPercent(chance)}%`,
          inline: true
        }
      );
  } else {
    embed.setDescription(
      `No winner was selected because the round had no eligible tickets. ` +
        `Every **\u23e3 ${TICKET_PRICE.toLocaleString()}** donated earns one ticket.`
    );
  }

  const announcement = await channel.send({
    embeds: [embed],
    allowedMentions: {
      users: round.winnerId ? [round.winnerId] : []
    }
  });

  await LotteryRound.updateOne(
    { _id: round._id, status: 'announcing' },
    {
      $set: {
        status: 'completed',
        announcementMessageId: announcement.id
      }
    }
  );
}

async function finishRound(client, round) {
  let prepared = round;
  if (prepared.status === 'drawing') {
    prepared = await prepareDrawing(prepared);
  }
  if (prepared?.status === 'announcing') {
    await announceDrawing(client, prepared);
  }
}

async function lotteryTick(client) {
  if (tickRunning) return;
  tickRunning = true;

  try {
    // Always keep a round open, even if retrying an older announcement fails.
    await ensureActiveRound();

    const unfinished = await LotteryRound.find({
      channelId: LOTTERY_CHANNEL_ID,
      status: { $in: ['drawing', 'announcing'] }
    }).sort({ scheduledDrawAt: 1 });

    for (const round of unfinished) {
      await finishRound(client, round);
    }

    const dueRound = await LotteryRound.findOneAndUpdate(
      {
        activeKey: LOTTERY_CHANNEL_ID,
        status: 'active',
        scheduledDrawAt: { $lte: new Date() }
      },
      {
        $set: { status: 'drawing' },
        $unset: { activeKey: 1 }
      },
      { new: true }
    );

    if (dueRound) {
      await ensureActiveRound();
      await finishRound(client, dueRound);
    } else {
      await ensureActiveRound();
    }
  } catch (error) {
    logger.error('Lottery scheduler error', error);
  } finally {
    tickRunning = false;
  }
}

function scheduleBoundaryTick(client) {
  const delay = Math.max(1_000, nextDrawAt().getTime() - Date.now());
  const timeout = setTimeout(async () => {
    await lotteryTick(client);
    scheduleBoundaryTick(client);
  }, delay);
  timeout.unref();
}

async function startLotteryScheduler(client) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  await LotteryRound.init();
  await lotteryTick(client);

  const interval = setInterval(() => lotteryTick(client), 30_000);
  interval.unref();
  scheduleBoundaryTick(client);
  logger.info('Lottery scheduler started (00:00 and 12:00 IST)');
}

async function getCurrentRoundSnapshot(userId) {
  const round = await ensureActiveRound();
  const entries = entriesForRound(round);
  const totalTickets = entries.reduce((sum, entry) => sum + entry.tickets, 0);
  const user = entries.find((entry) => entry.userId === userId) || {
    userId,
    donated: 0,
    tickets: 0
  };

  return {
    round,
    entries,
    totalTickets,
    user,
    prizeAmount: Math.floor(round.totalPool * PRIZE_PERCENT)
  };
}

function formatPercent(value) {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(2);
  return value.toFixed(1).replace(/\.0$/, '');
}

function chanceText(tickets, totalTickets) {
  if (!tickets || !totalTickets) return '1 in \u221e (0%)';

  const oneIn = totalTickets / tickets;
  const oneInText = Number.isInteger(oneIn) ? oneIn : oneIn.toFixed(2);
  return `1 in ${oneInText} (${formatPercent((tickets / totalTickets) * 100)}%)`;
}

module.exports = {
  DANK_MEMER_ID,
  LOTTERY_CHANNEL_ID,
  PRIZE_PERCENT,
  TICKET_PRICE,
  chanceText,
  componentText,
  entriesForRound,
  formatPercent,
  getCurrentRoundSnapshot,
  lotteryTick,
  nextDrawAt,
  parseDonationMessage,
  pickWinner,
  processDonationEdit,
  recordDonation,
  startLotteryScheduler
};
