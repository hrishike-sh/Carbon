const { createEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'howgay',
  aliases: ['hg'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  execute(message, args, client) {
    const what =
      message.mentions.users?.first()?.username ||
      args[0] ||
      message.author.username;

    const gay = Math.floor(Math.random() * 100) + 1;
    message.channel.send({
      embeds: [
        createEmbed({
          title: 'Gay Rate',
          description: `${what} is ${gay}% gay`,
          color: Math.floor(Math.random() * 0xffffff)
        })
      ]
    });
  }
};
