const { Collection } = require('discord.js');

class CooldownManager {
  constructor() {
    this._cooldowns = new Collection();
    this._activeLocks = new Set();
    this._sweepTimer = null;
  }

  check(userId, commandName, cooldownSeconds) {
    if (!Number.isFinite(cooldownSeconds) || cooldownSeconds <= 0) return { allowed: true };

    if (!this._cooldowns.has(commandName)) {
      this._cooldowns.set(commandName, new Collection());
    }

    const timestamps = this._cooldowns.get(commandName);
    const now = Date.now();
    const expiration = timestamps.get(userId);

    if (expiration && now < expiration) {
      return { allowed: false, remaining: Math.ceil((expiration - now) / 1000) };
    }

    timestamps.set(userId, now + cooldownSeconds * 1000);
    if (!this._sweepTimer) {
      this._sweepTimer = setInterval(() => this._sweep(), 60_000);
      this._sweepTimer.unref();
    }
    return { allowed: true };
  }

  _sweep(now = Date.now()) {
    for (const [commandName, timestamps] of this._cooldowns) {
      for (const [userId, expiration] of timestamps) {
        if (expiration <= now) timestamps.delete(userId);
      }
      if (timestamps.size === 0) this._cooldowns.delete(commandName);
    }
    if (this._cooldowns.size === 0) {
      clearInterval(this._sweepTimer);
      this._sweepTimer = null;
    }
  }

  clear() {
    clearInterval(this._sweepTimer);
    this._sweepTimer = null;
    this._cooldowns.clear();
    this._activeLocks.clear();
  }

  lock(userId) {
    if (this._activeLocks.has(userId)) return false;
    this._activeLocks.add(userId);
    return true;
  }

  unlock(userId) {
    this._activeLocks.delete(userId);
  }

  isLocked(userId) {
    return this._activeLocks.has(userId);
  }
}

module.exports = new CooldownManager();
module.exports.CooldownManager = CooldownManager;
