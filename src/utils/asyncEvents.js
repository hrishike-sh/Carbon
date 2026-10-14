const logger = require('./logger');

// EventEmitter does not await async listeners. Handle failures at the listener
// boundary so a failed reply or database operation cannot escape as a rejection.
function onAsync(emitter, event, handler, context = event) {
  emitter.on(event, async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      logger.error(`${context} failed`, error);
    }
  });
}

// Skip a tick while the previous task is still running. Intervals are registered
// with the client so shutdown can cancel every background job.
function startInterval(client, task, delay, context) {
  if (client.state.shuttingDown) return null;
  let running = false;
  const interval = setInterval(async () => {
    if (running || client.state.shuttingDown) return;
    running = true;
    try {
      await task();
    } catch (error) {
      logger.error(`${context} failed`, error);
    } finally {
      running = false;
    }
  }, delay);
  interval.unref();
  client.state.timers ??= new Set();
  client.state.timers.add(interval);
  return interval;
}

module.exports = { onAsync, startInterval };
