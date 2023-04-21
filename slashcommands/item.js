const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Client } = require('discord.js');
const DB = require('../database/models/itemSchema');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('modify-item')
    .setDescription('Modify an item')
    .addSubcommand((cmd) => {
      return cmd
        .setName('value')
        .setDescription('Modify the value of an item.')
        .addStringOption((o) => {
          return o
            .setName('id')
            .setDescription('Item ID of the item.')
            .setRequired(true);
        })
        .addStringOption((o) => {
          return o
            .setName('value')
            .setDescription('New value of the item')
            .setRequired(true);
        });
    }),
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const roles = [
      '825783847622934549',
      '824539655134773269',
      '824348974449819658'
    ];
    if (!interaction.member.roles.cache.hasAny(...roles)) {
      return interaction.reply({
        content: 'You dont have permission to run this',
        ephemeral: true
      });
    }
    const type = interaction.options.getSubcommand();
    if (type == 'value') {
      const data = {
        id: interaction.options.getString('id').toLowerCase(),
        val: client.functions.parseAmount(
          interaction.options.getString('value')
        )
      };

      const item = await DB.findOne({
        item_id: data.id
      });
      if (!item) {
        return interaction.reply(`No item with ID \`${data.id}\` found.`);
      }
      if (!data.val) {
        return interaction.reply(`Please enter valid value.`);
      }
      item.value = data.val;
      item.save();

      interaction.reply({
        content: `\`${
          item.display.name
        }\`'s value has been changed to ${data.val.toLocaleString()}.`
      });
    }
  }
};
