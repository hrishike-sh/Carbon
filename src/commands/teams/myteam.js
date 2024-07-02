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
    const userId = message.author.id;
    const team = await TeamDB.findOne({ users: userId });
    if (!team) return message.reply('You are not in a team.');

    let totalCoins = 0;
    team.users.forEach(async (user) => {
      totalCoins += (
        await database.findOne({
          userId: user
        })
      ).coins;
    });

    const embed = new EmbedBuilder()
      .setTitle(team.name)
      .addFields([
        {
          name: 'Wealth',
          value: `Points: ${
            team.points
          }\nCoins: ${totalCoins.toLocaleString()}`,
          inline: true
        },
        {
          name: 'Members',
          value: team.users.map((a) => `- <@${a}>`).join('\n'),
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
