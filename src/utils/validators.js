const StringValues = {
  k: 1000,
  m: 1000000,
  b: 1000000000
};

function parseAmount(input) {
  if (!input || typeof input !== 'string') return { valid: false };

  const match = input.match(/^(\d+(?:\.\d+)?)([kmb]?)$/i);
  if (!match) return { valid: false };

  const num = parseFloat(match[1]);
  const suffix = match[2].toLowerCase();

  return {
    valid: true,
    value: suffix ? Math.floor(num * StringValues[suffix]) : Math.floor(num)
  };
}

module.exports = { StringValues, parseAmount };
