const { model, Schema } = require('mongoose');

const TeamSchema = new Schema({
  users: { type: [String], default: [] },
  points: { type: Number, default: 0 },
  name: { type: String, required: true },
  lastLb: { type: Date, default: () => new Date(Date.now() - 86400000) },
  lootboxes: { type: Map, of: Number, default: {} },
  lives: { type: Number, default: 5 },
  summerFight: {
    attackWindowStartedAt: { type: Date, default: () => new Date(0) },
    attacksUsed: { type: Number, default: 0 },
    shieldDay: { type: String, default: '' },
    shieldUses: { type: Number, default: 0 },
    shieldExpiresAt: { type: Date, default: null },
    immunityExpiresAt: { type: Date, default: null },
    pendingAttack: {
      attackerTeamId: { type: Schema.Types.ObjectId, default: null },
      attackerTeamName: { type: String, default: '' },
      createdAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      channelId: { type: String, default: '' }
    },
    stats: {
      attacksSucceeded: { type: Number, default: 0 },
      attacksFailed: { type: Number, default: 0 },
      manualBlocks: { type: Number, default: 0 },
      shieldBlocks: { type: Number, default: 0 },
      shieldsUsed: { type: Number, default: 0 }
    }
  }
});

module.exports = model('teams', TeamSchema);
