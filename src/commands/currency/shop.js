const {
  Message,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder
} = require('discord.js');
const Database = require('../../database/models/coins');
const Teams = require('../../database/models/teams');
const { Theme } = require('../../utils/embeds');

const SHOP = [];

module.exports = {
  name: 'shop',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    return message.reply('Shop is closed.');
  }
};
