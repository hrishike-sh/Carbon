const { Events } = require('discord.js');
const { recover } = require('../utils/tournament');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute: recover
};
