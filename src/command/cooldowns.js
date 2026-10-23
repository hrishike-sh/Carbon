const { Collection } = require('discord.js');

class CooldownManager {
  constructor() {
    this._cooldowns = new Collection();
    this._activeLocks = new Set();
  }

  check(userId, commandName, cooldownSeconds) {
    if (!cooldownSeconds || cooldownSeconds <= 0) return { allowed: true };

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
    setTimeout(() => timestamps.delete(userId), cooldownSeconds * 1000);
    return { allowed: true };
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
