const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function log(level, message, meta) {
  if (LOG_LEVELS[level] < currentLevel) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, meta);
  } else {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};
