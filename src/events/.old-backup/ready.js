const { Events, Colors } = require('discord.js');
const { loadHighlights } = require('./messageCreate/highlight');
const settingsService = require('../database/services/settingsService');
const afkModel = require('../database/models/afk');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`[BOT]: Client is online!\n  Server Count: ${client.guilds.cache.size}`);

    client.user.setPresence({ status: 'dnd' });

    client.state.counts = {
      commandsRan: 0,
      messagesRead: 0
    };

    // Load settings cache
    const settings = await settingsService.load();
    client.state.afkIgnore = settings.afkIgnore || [];

    // Load highlights into memory
    await loadHighlights(client);

    // Load AFK users into memory
    client.state.afks = [];
    const afkUsers = await afkModel.find();
    for (const afkUser of afkUsers) {
      client.state.afks.push(afkUser.userId);
    }

    // Trigger 2025 event scheduler
    client.emit('tick');

    // Leave small guilds (keep only main guild)
    if (client.shard) {
      client.shard.broadcastEval((c) => {
        c.guilds.cache.forEach(async (guild) => {
          if (guild.id !== '856111404322258956' && guild.memberCount < 10) {
            await guild.leave().catch(() => {});
            console.log(`Left: ${guild.name}`);
          }
        });
      });
    }
  }
};
