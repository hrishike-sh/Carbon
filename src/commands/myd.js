const { Message, Client } = require('discord.js');
const MAIN = require('../database/main_dono');
module.exports = {
  name: 'myd',
  aliases: ['mydono', 'mydonation', 'mydonations'],
  cooldown: 2.5,
  /**
   *
   * @param {Message} message
   * @param {[String]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target = message.mentions.users?.first() || message.author;

    const USER = await MAIN.findOne({
      userID: target.id,
      guildID: message.guild.id
    });
    if (!USER?.messages) {
      return message.reply(`${target.toString()} has not donated anything!`);
    }

    return message.reply({
      embeds: [
        {
          author: {
            name: target.tag,
            proxy_icon_url: target.displayAvatarURL()
          },
          description: `**Coins:** ⏣ ${USER.messages.toLocaleString()}`,
          footer: {
            text: 'This is a temporary command!'
          }
        }
      ]
    });
  }
};
