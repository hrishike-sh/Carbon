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

  return suffix ? Math.floor(num * StringValues[suffix]) : Math.floor(num);
}

module.exports = { StringValues, parseAmount };
