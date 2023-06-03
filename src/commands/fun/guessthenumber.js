const { Message, MessageEmbed, Client } = require('discord.js');

module.exports = {
  name: 'guessthenumber',
  aliases: ['gtn'],
  cooldown: 60,
  roles: ['858088054942203945', '824539655134773269', '824348974449819658'],
  /**
   *
   * @param {Message} message
   * @param {[String]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!args) {
      return message.reply({
        embeds: [
          {
            color: 'Red',
            description:
              'Please provide an upper-limit for the GTN.\n\nExample: fh gtn 2500'
          }
        ]
      });
    }
    const randomNumber = Math.floor(Math.random());

    message.channel.send(randomNumber.toString());
  }
};
