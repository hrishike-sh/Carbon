const { randomBytes } = require('crypto');

/**
 * @param {String} string
 *
 * @returns Calculated value or null
 */
const parseAmount = (string) => {
  // Checks if first digit is valid number
  if (isNaN(string[0])) return null;

  // Return if number is like "5e4" etc.
  if (!isNaN(Number(string))) return Number(string);

  // Check for "m", "k" etc. and return value
  if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
    return null;

  // Add values of m, k and b
  const val = string[string.length - 1];
  const rawString = string.replace(string[string.length - 1], '');
  const calculated = parseInt(rawString) * StringValues[val];

  // Invalid number
  if (isNaN(calculated)) return null;
  else return calculated;
};

const StringValues = {
  m: 1e6,
  k: 1e3,
  b: 1e9
};
const { Client } = require('discord.js');

/**
 * @param {Client} client
 * @param {String} id
 */
const DMUser = async (client, id, { embeds, content }) => {
  try {
    const user = await client.users.fetch(id);
    if (user) {
      (await user.createDM()).send({
        content: content ? content.toString() : '',
        embeds: embeds ? [embeds] : []
      });
    }
  } catch (e) {
    return null;
  }
};
/**
 *
 * @param {Number} min
 * @param {Number} max
 *
 * @returns Random number between `min` and `max`
 */
const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const formatTime = (time, format) => {
  return `<t:${(time / 1000).toFixed(0)}:${format || 'R'}>`;
};

const getRandomHash = () => {
  return randomBytes(18).toString('hex');
};

module.exports.parseAmount = parseAmount;
module.exports.dmUser = DMUser;
module.exports.getRandom = getRandom;
module.exports.sleep = sleep;
module.exports.formatTime = formatTime;
module.exports.getRandomHash = getRandomHash;
