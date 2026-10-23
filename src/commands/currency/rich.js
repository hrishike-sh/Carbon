const { CoinService } = require('../../database/services/coinService');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'rich',

  async execute(message, args, client) {
    const all = await CoinService.getLeaderboard(10);
    const msg = await message.channel.send({
      embeds: [infoEmbed({ description: 'Loading...' })]
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
        infoEmbed({
          title: '<:token:1003272629286883450> Coins Leaderboard',
          description,
          footer: 'Gamble your way to the top!'
        })
      ]
    });
  }
};
