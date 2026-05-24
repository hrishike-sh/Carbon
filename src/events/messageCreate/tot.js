const config = require('../../config');
const { sleep } = require('../../utils/helpers');

module.exports = {
  name: 'tot',

  async execute(message) {
    if (message.guild.id !== config.ids.guildId) return;

    const content = message.content.toLowerCase();
    if (content !== 'pls tot' && content !== 'trickortreat') return;

    if (message.channel.id === config.ids.channels.restrictedCurrencyChannels[4]) return; // giveaway channel

    const role = config.roles.totRole;
    if (message.member.roles.cache.has(role)) {
      return message.reply({ content: 'You already have the role 👻' });
    }

    await message.member.roles.add(role);
    return message.reply({
      embeds: [
        {
          title: 'Trick or Treat 🍬',
          description: `I've given you the <@&${role}> role.`,
          color: 0xFF6F61,
          footer: { text: 'Happy Halloween 🎃' }
        }
      ]
    });
  }
};
