const { EmbedBuilder } = require('discord.js');
const { Message } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    if (message.author.bot) return;
    if (message.guild.id != '824294231447044197') return;

    if (
      message.content.toLowerCase() == 'pls tot' ||
      message.content.toLowerCase() == 'trickortreat'
    ) {
      const role = '1301486755513372672';

      if (message.channel.id == '870240187198885888') return;
      if (message.member.roles.cache.has(role)) {
        return message.reply({
          content: `You already have the role 👻`
        });
      } else {
        await message.member.roles.add(role);

        return message.reply({
          embeds: [
            {
              title: 'Trick or Treat 🍬',
              description: `I've given you the <@&${role}> role.`,
              color: 16738599,
              footer: {
                text: 'Happy Halloween 🎃'
              }
            }
          ]
        });
      }
    }
  }
};
