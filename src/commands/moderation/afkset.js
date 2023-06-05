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
      let userId = args.shift();
      if (!userId) return message.reply(eg);

      userId = userId.replace(/[^0-9]/g, '');
      const dbEntry = await DATABASE.findOne({
        userId
      });
      if (!dbEntry) return message.reply(`User ID: ${userId} is not AFK!`);

      await DATABASE.deleteOne({ userId });
      client.db.afks = client.db.afks.filter((a) => a !== userId);
      return message.reply(`<@${userId}> should no longer be AFK.`);
    } else return message.reply(eg);
  }
};
