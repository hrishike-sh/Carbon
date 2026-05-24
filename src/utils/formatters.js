function formatTime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
}

function parseTime(input) {
  if (!input || typeof input !== 'string') return null;

  const match = input.match(/^(\d+)([dhms])$/i);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * multipliers[unit];
}

module.exports = { formatTime, parseTime };
