const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const db = require('../database/models/itemSchema');
module.exports = {
  category: 'Donation',
  data: new SlashCommandBuilder()
    .setName('additem')
    .setDescription('Add an item to the items list')
    .addStringOption((sus) => {
      return sus
        .setName('item_id')
        .setDescription('The id of the item.')
        .setRequired(true);
    })
    .addNumberOption((sus) => {
      return sus
        .setName('item_value')
        .setDescription('Default value of the item.')
        .setRequired(true);
    })
    .addStringOption((sus) => {
      return sus
        .setRequired(true)
        .addChoices([
          {
            name: 'Collectable',
            value: 'col'
          },
          {
            name: 'Sellable',
            value: 'sell'
          },
          {
            name: 'Work Items',
            value: 'work'
          },
          {
            name: 'Pepe Item',
            value: 'pepe'
          },
          {
            name: 'Other',
            value: 'other'
          }
        ])
        .setName('type')
        .setDescription('Type of the item.');
    })
    .addStringOption((sus) => {
      return sus
        .setName('thumbnail_url')
        .setDescription('Image of the item')
        .setRequired(true);
    })
    .addStringOption((sus) => {
      return sus
        .setName('display_name')
        .setDescription('Display name of the item')
        .setRequired(true);
    }),
  /**
   *
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    const data = {
      id: interaction.options.getString('item_id'),
      value: interaction.options.getNumber('item_value'),
      url: interaction.options.getString('thumbnail_url'),
      display_name: interaction.options.getString('display_name'),
      category: interaction.options.getString('type')
    };

    if (
      !interaction.member.roles.cache.some(
        (role) => role.id === '824539655134773269'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '824348974449819658'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '825783847622934549'
      ) &&
      !interaction.member.roles.cache.some(
        (role) => role.id === '858088054942203945'
      ) &&
      interaction.author.id !== '786150805773746197'
    ) {
      return interaction.reply({
        content: 'Only staff can run this command.',
        ephemeral: true
      });
    }

    const item = await db.findOne({
      item_id: data.id
    });

    if (item) {
      return await interaction.reply({
        content: `An item with the id \`${data.id}\` already exists!`
      });
    }

    new db({
      item_id: data.id,
      value: data.value,
      display: {
        name: data.display_name,
        thumbnail: data.url
      },
      category: data.category.toLowerCase(),
      lastUpdated: new Date().getTime()
    }).save();

    interaction.reply({
      embeds: [
        {
          title: data.display_name,
          description: `**Value:** ${data.value.toLocaleString()}`,
          thumbnail: {
            url: data.url
          }
        }
      ]
    });
  }
};
