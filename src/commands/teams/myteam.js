const TeamDB = require('../../database/models/teams');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'myteam',
  aliases: ['team'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    const userId = message.mentions?.users?.first()?.id || message.author.id;
    const team = await TeamDB.findOne({ users: userId });
    if (!team) return message.reply('You are not in a team.');

    return message.reply({
      embeds: [
        infoEmbed({
          title: team.name,
          fields: [
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
          ],
          timestamp: true
        })
      ]
    });
  }
};
