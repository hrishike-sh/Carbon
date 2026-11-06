const { Events } = require('discord.js');
const { reportWinner } = require('../utils/tournament');

module.exports = { name: Events.MessageCreate, execute: reportWinner };
