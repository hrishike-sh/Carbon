const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');

  if (!fs.existsSync(eventsPath)) {
    logger.warn('Events directory not found');
    return;
  }

  const entries = fs.readdirSync(eventsPath, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const fullPath = path.join(eventsPath, entry.name);

    if (entry.isDirectory()) {
      const indexPath = path.join(fullPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        registerEvent(client, indexPath);
        count += countHandlers(indexPath);
      }
    } else if (entry.name.endsWith('.js')) {
      registerEvent(client, fullPath);
      count++;
    }
  }

  logger.info(`Loaded ${count} event handlers`);
}

function registerEvent(client, filePath) {
  try {
    const event = require(filePath);

    if (!event.name || !event.execute) {
      logger.warn(`Event at ${filePath} missing name or execute`);
      return;
    }

    const execute = (...args) => Promise.resolve()
      .then(() => event.execute(...args, client))
      .catch((err) => logger.error(`Event "${event.name}" failed (${filePath})`, err));

    if (event.once) client.once(event.name, execute);
    else client.on(event.name, execute);
  } catch (err) {
    logger.error(`Failed to load event ${filePath}`, err);
  }
}

function countHandlers(indexPath) {
  try {
    const mod = require(indexPath);
    if (mod.handlers) return mod.handlers.length;
  } catch {}
  return 1;
}

module.exports = { loadEvents };
