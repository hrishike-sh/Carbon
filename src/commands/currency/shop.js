const {
  Message,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  Colors
} = require('discord.js');

const SHOP = [
  {
    name: 'Point for Team',
    price: 1e6,
    duration: Infinity,
    emoji: {
      str: '<:plusone:1255581374661005363>',
      id: '1255581374661005363'
    },
    value: 'point'
  },
  {
    name: 'Custom Channel',
    price: 1e6,
    duration: 31,
    emoji: {
      str: '<:text_channel:1003342275037888522>',
      id: '1003342275037888522'
    },
    value: 'channel'
  },
  {
    name: 'Custom Role',
    price: 1e6,
    duration: 31,
    emoji: {
      str: '<:role:1003345268751741099>',
      id: '1003345268751741099'
    },
    value: 'role'
  }
];
module.exports = {
  name: 'shop',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('Shop | Opens Soon')
      .setFooter({
        text: 'Prices are placeholders and are subject to change.'
      })
      .setColor(Colors.Green)
      .addFields(
        SHOP.map((item) => ({
          name: `${item.emoji.str} ${item.name}`,
          value: `<:blank:914473340129906708>**Price**: <:token:1003272629286883450> ${item.price.toLocaleString()}\n<:blank:914473340129906708>**Duration**: ${item.duration.toLocaleString()} Days`
        }))
      );
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('shop_shop')
      .setPlaceholder('Select an item')
      .addOptions(
        SHOP.map((item) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(item.name)
            .setValue(item.value)
            .setEmoji(item.emoji.str)
            .setDescription(`Price: ${item.price.toLocaleString()} coins.`);
        })
      );
    const row = new ActionRowBuilder().addComponents(selectMenu);

    return message.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
