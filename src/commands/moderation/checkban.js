const { Message, Client, Colors } = require('discord.js');

module.exports = {
  name: 'checkban',
  aliases: ['cb'],
  roles: ['848576301182877727'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const FH = client.guilds.cache.get('824294231447044197');
    const target = args[0]?.replace(/[^0-9]/g, '');
    if (!target) return message.reply('Please provide a user argument.');

    const bannedUser = (await FH.bans.fetch(target).catch(() => null)) || null;
    if (!bannedUser) return message.reply('Provided user is not banned.');

    await message.channel.send({
      embeds: [
        {
          title: 'Ban Check',
          description: `UserID: ${target}\nBanned reason: ${
            bannedUser.reason || 'No reason provided.'
          }`,
          color: Colors.Red
        }
      ]
    });
  }
};
