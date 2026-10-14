const StringValues = {
  k: 1000,
  m: 1000000,
  b: 1000000000
};

function parseAmount(input) {
  if (!input || typeof input !== 'string') return null;

  const match = input.trim().match(/^(\d+(?:\.\d+)?(?:e\d+)?)([kmb]?)$/i);
  if (!match) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;

  const suffix = match[2].toLowerCase();

  const amount = Math.floor(num * (StringValues[suffix] || 1));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

module.exports = { StringValues, parseAmount };
