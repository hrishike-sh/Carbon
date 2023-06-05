const { Message, Client } = require('discord.js');
const DATABASE = require('../../database/afk');

module.exports = {
  name: 'afkset',
  cooldown: 3,
  roles: ['824539655134773269', '824348974449819658'],
  async execute(message, args, client) {
    // fh afkset clear @user/user_id
    const eg = `**How to use this command:**\n\n> fh afkset clear user_id/@user\nRemoves AFK from user_id.`;
    const action = args.shift();
    if (!action) {
      return message.reply(eg);
    }

    if (action.toLowerCase() == 'clear') {
      const userId = args.shift();
      message.reply('USER ID: ' + userId);
    } else return message.reply(eg);
  }
};
