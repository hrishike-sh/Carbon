const { Message, Client, Colors, EmbedBuilder } = require('discord.js');
const halloween = require('../../database/halloween');

module.exports = {
  name: 'halloween-leaderboard',
  aliases: 'hlb',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const raw = await halloween.find({}).sort({ points: -1 }).limit(10);
    const mapped = raw.map(
      (a, ind) => `${ind + 1}. <@&${a.roleId}>: ${a.points} points`
    );
    const embed = new EmbedBuilder()
      .setTitle(':ghost: Halloween Leaderboard')
      .setColor(Colors.Purple)
      .setDescription(mapped.join('\n'))
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
