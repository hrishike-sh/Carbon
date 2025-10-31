const { EmbedBuilder } = require('discord.js');
const { Message } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    if (message.author.id != '270904126974590976') return;
    if (!message.embeds.length) return;

    const halRole = '1301486755513372672';

    if (
      message.embeds[0]?.title.includes('Trick') ||
      message.embeds[0].description.includes('trick or treated')
    ) {
      const reference = message.reference;
      const msg = await message.channel.messages.fetch(reference.messageId);

      if (msg.member.roles.cache.has(halRole)) {
        await msg.reply({
          content: 'You already have the role 👻'
        });
      } else {
        await msg.member.roles.add(halRole);

        const embed = new EmbedBuilder()
          .setTitle('Happy Halloween 🎃')
          .setDescription("I've given you the <@&> role 👻");

        await msg.reply({ embeds: [embed] });
      }
    } else return;
  }
};
