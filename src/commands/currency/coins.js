const { CoinService } = require('../../database/services/coinService');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'coins',
  aliases: ['coin', 'bal', 'balance', 'cash'],
  description: 'Check your coin balance.',

  async execute(message, args) {
    const user =
      message.mentions.members?.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    const balance = (await CoinService.getBalance(user.id)).toLocaleString().split('.')[0] || 0;

    return message.reply({
      embeds: [
        infoEmbed({
          author: {
            name: user.user.username,
            iconURL: user.user.displayAvatarURL()
          },
          description: `**Balance:** <:token:1003272629286883450> ${balance}`,
          timestamp: true
        })
      ]
    });
  }
};
