const { Message, Client, Colors } = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'rich',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const all = await Database.find().sort({ coins: -1 }).limit(10);
    const msg = await message.channel.send({
      embeds: [{ description: 'Loading...' }]
    });
    let description = '';
    for (let i = 0; i < 10; i++) {
      let user = (await client.users.fetch(all[i].userId)).tag;
      if (user.includes('~')) {
        user = user.replace(/~/g, '~');
      } else if (user.includes('_')) {
        user = user.replace(/_/g, '_');
      }
      description += `\`${(i + 1)
        .toString()
        .padStart(2, 0)}\` ${user}: <:token:1003272629286883450> ${
        all[i].coins.toLocaleString().split('.')[0]
      }\n`;
    }
    msg.edit({
      embeds: [
        {
          title: '<:token:1003272629286883450> Coins Leaderboard',
          description,
          color: Colors.DarkAqua,
          footer: {
            text: 'Gamble your way to the top!'
          }
        }
      ]
    });
  }
};
