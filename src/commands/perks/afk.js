const { Message, Client } = require('discord.js');
const DATABASE = require('../../database/afk');

module.exports = {
  name: 'afk',
  cooldown: 5,
  roles: [
    '824687430753189902',
    '825283097830096908',
    '831998003958906940',
    '826196972167757875',
    '839803117646512128',
    '824348974449819658',
    '999911429421408346'
  ],
  async execute(message, args, client) {}
};
