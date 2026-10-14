const { syncSkullboard } = require('../utils/skullboard');

module.exports = {
  name: 'messageReactionRemove',
  execute: (reaction) => syncSkullboard(reaction)
};
