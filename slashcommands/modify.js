const { CommandInteraction, SlashCommandBuilder } = require('discord.js');
const db = require('../database/models/itemSchema');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('modify')
    .setDescription('Modify an item.')
    .addStringOption((opt) => {
      return opt
        .setName('item_id')
        .setDescription('Current item id of the item.')
        .setRequired(true);
    })
    .addStringOption((opt) => {
      return opt
        .setName('new_url')
        .setDescription('New URL for the item.')
        .setRequired(false);
    })
    .addNumberOption((opt) => {
      return opt
        .setName('new_value')
        .setDescription('Change the value of the item.')
        .setRequired(false);
    })
    .addStringOption((opt) => {
      return opt
        .setName('new_name')
        .setDescription('Set the display name of the item.')
        .setRequired(false);
    }),
  category: 'Donation',
  /**
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    if (
      !interaction.member.roles.cache.some(
        (role) => role.id === '824539655134773269'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '825783847622934549'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '858088054942203945'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '824348974449819658'
      )
    ) {
      return interaction.reply({
        content: 'No, Only staff can use this.',
        ephemeral: true
      });
    }
    const data = {
      itemId: interaction.options.getString('item_id'),
      url: interaction.options?.getString('new_url'),
      value: interaction.options?.getNumber('new_value'),
      name: interaction.options?.getString('new_name')
    };

    if (!data.url && !data.value && !data.name) {
      return interaction.reply({
        content: 'What am I supposed to do? :sob:'
      });
    }

    const item = await db.findOne({
      item_id: data.itemId
    });
    if (!item) return interaction.reply('No such item found.');

    if (data.url) {
      item.display.thumbnail = data.url;
    }
    if (data.value) {
      item.value = data.value;
    }
    if (data.itemId) {
      item.item_id = data.itemId;
    }
    if (data.name) {
      item.display.name = data.name;
    }

    item.save();
    interaction.reply({
      embeds: [
        {
          title: item.display.name,
          description: `**Value:** ${item.value.toLocaleString()}`,
          thumbnail: {
            url: item.display.thumbnail
          }
        }
      ]
    });
  }
};
