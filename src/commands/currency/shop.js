const { Message, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shop',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('Shop | Coming Soon')
      .setFooter({
        text: 'Shop coming soon!'
      })
      .addFields([
        {
          name: '<:text_channel:1003342275037888522> Custom Channel',
          value:
            '<:blank:914473340129906708>**Price**: <:token:1003272629286883450> ?,???,???\n<:blank:914473340129906708>**Duration**: ?? Days'
        },
        {
          name: '<:role:1003345268751741099> Custom Role',
          value:
            '<:blank:914473340129906708>**Price**: <:token:1003272629286883450> ?,???,???\n<:blank:914473340129906708>**Duration**: ?? Days'
        }
      ])
      .setColor('Green')
      .setDescription('To suggest something for the shop, dm admins!');

    return message.reply({
      embeds: [embed]
    });
  }
};
