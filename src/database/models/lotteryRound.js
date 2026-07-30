const { Schema, model } = require('mongoose');

const LotteryRoundSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    activeKey: { type: String },
    status: {
      type: String,
      enum: ['active', 'drawing', 'announcing', 'completed'],
      default: 'active',
      index: true
    },
    startedAt: { type: Date, required: true },
    scheduledDrawAt: { type: Date, required: true, index: true },
    drawnAt: { type: Date },
    totalPool: { type: Number, default: 0, min: 0 },
    totalTickets: { type: Number, default: 0, min: 0 },
    donationsByUser: {
      type: Map,
      of: Number,
      default: () => new Map()
    },
    processedMessageIds: { type: [String], default: [], index: true },
    winnerId: { type: String },
    winnerTickets: { type: Number, default: 0 },
    prizeAmount: { type: Number, default: 0 },
    announcementMessageId: { type: String }
  },
  { timestamps: true }
);

LotteryRoundSchema.index(
  { activeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activeKey: { $type: 'string' } }
  }
);

module.exports = model('lotteryRound', LotteryRoundSchema, 'lotteryRounds');
