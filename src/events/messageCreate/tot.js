const config = require('../../config');
const { warningEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'tot',

  async execute(message) {
    if (message.guild.id !== config.ids.guildId) return;

    const content = message.content.toLowerCase();
    if (content !== 'pls tot' && content !== 'trickortreat') return;

    if (message.channel.id === config.ids.channels.restrictedCurrencyChannels[4]) return;

    const role = config.roles.totRole;
    if (message.member.roles.cache.has(role)) {
      return message.reply({ content: 'You already have the role 👻' });
    }

    await message.member.roles.add(role);
    return message.reply({
      embeds: [
        warningEmbed({
          title: 'Trick or Treat',
          description: `I've given you the <@&${role}> role.`,
          footer: 'Happy Halloween!'
        })
      ]
    });
  }
};
