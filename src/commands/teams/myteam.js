const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
const TeamDB = require('../../database/teams');
const database = require('../../database/coins');
module.exports = {
  name: 'myteam',
  aliases: ['team'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    let userId;
    if (args[0]) {
      userId =
        message.mentions?.users?.first()?.id ||
        message.guild.members.cache.get(args[0])?.id;
    }
    const team = await TeamDB.findOne({ users: userId });
    if (!team) return message.reply('You are not in a team.');

    const embed = new EmbedBuilder()
      .setTitle(team.name)
      .addFields([
        {
          name: 'Wealth',
          value: `Points: ${team.points}`,
          inline: true
        },
        {
          name: 'Members',
          value: team.users.map((a) => `<@${a}>`).join(' '),
          inline: true
        }
      ])
      .setColor(Colors.Gold)
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });
  }
};
