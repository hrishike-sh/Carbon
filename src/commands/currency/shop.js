const {
  Message,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  Colors
} = require('discord.js');
const Database = require('../../database/coins');

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
  },
  {
    name: 'Absolutely Nothing',
    price: 1000,
    duration: Infinity,
    emoji: {
      str: '<:shrug:1255590797416333364>',
      id: '1255590797416333364'
    },
    value: 'nothing'
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
          name: `${item.emoji.str}${item.name}`,
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
      )
      .setMaxValues(1)
      .setMinValues(1);
    const row = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await message.reply({
      embeds: [embed],
      components: [row]
    });
    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      idle: 30_000,
      max: 1
    });
    collector.on('collect', async (interaction) => {
      const value = interaction.values[0];
      interaction.deferUpdate();

      if (value === 'nothing') {
        const DatabaseUser = await Database.findOne({
          userId: message.author.id
        });
        const item = SHOP.filter((a) => a.value == value)[0];
        if (item.price > DatabaseUser?.coins) {
          return msg.reply({
            content: `${message.author} you don't have enough coins.`
          });
        }
        DatabaseUser.coins -= item.price;
        await DatabaseUser.save();
        msg.reply({
          embeds: [
            {
              color: Colors.Green,
              description: `You have purchased ${
                item.name
              }!\n\n-${item.price.toLocaleString()}coins\n+Nothing`
            }
          ]
        });
      } else {
        msg.reply({
          content: 'You cannot buy this item yet.'
        });
      }
    });

    collector.on('end', (collected) => {
      row.components[0].setDisabled(true);
      msg.edit({ components: [row] });
    });
  }
};
