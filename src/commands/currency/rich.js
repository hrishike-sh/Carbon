const { Colors } = require('discord.js');
const { CoinService } = require('../../database/services/coinService');

module.exports = {
  name: 'rich',

  async execute(message, args, client) {
    const all = await CoinService.getLeaderboard(10);
    const msg = await message.channel.send({
      embeds: [{ description: 'Loading...' }]
    });

    let description = '';
    for (let i = 0; i < all.length; i++) {
      let user = (await client.users.fetch(all[i].userId).catch(() => ({ tag: 'Unknown User' }))).tag;

      if (user.includes('_')) {
        user = user.replace(/_/g, '\\_');
      }

      description += `\`${(i + 1).toString().padStart(2, 0)}\` ${user}: <:token:1003272629286883450> ${
        all[i].coins.toLocaleString().split('.')[0]
      }\n`;
    }

    msg.edit({
      embeds: [
        {
          title: '<:token:1003272629286883450> Coins Leaderboard',
          description,
          color: Colors.DarkAqua,
          footer: { text: 'Gamble your way to the top!' }
        }
      ]
    });
  }
};
