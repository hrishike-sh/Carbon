const { syncSkullboard } = require('../utils/skullboard');

module.exports = {
  name: 'messageReactionAdd',
  execute: (reaction) => syncSkullboard(reaction, true)
};
