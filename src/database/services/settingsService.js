const Settings = require('../models/settingsSchema');
const config = require('../../config');

class SettingsService {
  constructor() {
    this._cache = null;
    this._loading = null;
  }

  async load() {
    if (this._loading) return this._loading;
    this._loading = Settings.findOneAndUpdate(
      { guildID: config.guildId },
      { $setOnInsert: { guildID: config.guildId } },
      { upsert: true, new: true }
    ).exec();
    try {
      this._cache = await this._loading;
      return this._cache;
    } finally {
      this._loading = null;
    }
  }

  async reload() {
    return this.load();
  }

  get afkIgnore() {
    return this._cache?.afkIgnore || [];
  }

  get donationRoles() {
    return this._cache?.donationRoles || [];
  }

  get logChannel() {
    return this._cache?.logChannel || null;
  }

  get gtnRole() {
    return this._cache?.gtnRole || [];
  }

  get skullBoard() {
    return this._cache?.skullBoard || { enabled: false, count: 10, channelId: null };
  }

  get disabledDrop() {
    return this._cache?.disabledDrop || [];
  }

  get snipeConfig() {
    return this._cache?.snipe_config || { enabled: false, allowed_roles: [] };
  }

  get giveawayConfig() {
    return this._cache?.giveaway_config || {
      manager_roles: [],
      blacklisted_roles: [],
      bypass_roles: []
    };
  }

  get lockdownSet() {
    return this._cache?.lockdownSet || {
      channels: [],
      lockDowned: false,
      issuedBy: null,
      message: null
    };
  }

  get heistMode() {
    return this._cache?.heistMode || {
      enabled: false,
      joined: 0,
      left: 0,
      startedOn: 0
    };
  }

  get censors() {
    return this._cache?.censors || { censors: [], timeout_duration: 0 };
  }

  get pings() {
    return this._cache?.pings || { mini: 0, gaw: 0, event: 0 };
  }
}

module.exports = new SettingsService();
