const DATABASE = require('../../database/models/afk');

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

  async execute(message, args, client) {
    let reason = args.join(' ') || 'AFK';
    reason = reason.replace(/(@(everyone|here|[!&]?[\d]+))/gi, '');

    if (reason.toLowerCase() === 'remove') {
      await DATABASE.deleteOne({ userId: message.author.id });
      client.state.afks = client.state.afks.filter((id) => id !== message.author.id);
      return message.reply('You are no longer AFK!');
    }

    const dbUser = await DATABASE.findOne({ userId: message.author.id });
    if (dbUser) {
      return message.reply("You're already AFK!");
    }

    const entry = new DATABASE({
      userId: message.author.id,
      reason,
      time: Date.now(),
      dms: []
    });

    await entry.save();

    message.reply(`You are now AFK!\nReason: ${reason}`);

    setTimeout(() => {
      client.state.afks.push(message.author.id);
    }, 5000);
  }
};
