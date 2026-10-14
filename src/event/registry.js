const fs = require('node:fs');
const path = require('node:path');
const logger = require('../utils/logger');

function loadEvents(client, directory = path.join(__dirname, '..', 'events')) {
  const events = [];
  const errors = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = entry.isDirectory()
      ? path.join(directory, entry.name, 'index.js')
      : path.join(directory, entry.name);
    if (entry.isDirectory() && !fs.existsSync(filePath)) continue;
    if (!entry.isDirectory() && (!entry.isFile() || !entry.name.endsWith('.js'))) continue;

    try {
      const event = require(filePath);
      if (event.disabled === true) continue;
      if (typeof event.name !== 'string' || !event.name || typeof event.execute !== 'function') {
        throw new TypeError('Event must export a name and an execute function');
      }
      events.push({ event, filePath });
    } catch (cause) {
      errors.push(new Error(`Failed to load ${filePath}: ${cause.message}`, { cause }));
    }
  }

  // Do not leave a partially registered bot running when one module is broken.
  if (errors.length) throw new AggregateError(errors, 'Event loading failed');
  for (const { event, filePath } of events) {
    const execute = (...args) => Promise.resolve()
      .then(() => event.execute(...args, client))
      .catch((err) => logger.error(`Event "${event.name}" failed (${filePath})`, err));
    if (event.once) client.once(event.name, execute);
    else client.on(event.name, execute);
  }
  const count = events.reduce((total, { event }) => total + (event.handlers?.length || 1), 0);
  logger.info(`Loaded ${count} event handlers`);
  return count;
}

module.exports = { loadEvents };