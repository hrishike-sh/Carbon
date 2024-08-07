const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot!'),
  async execute(interaction) {
    await interaction.reply(`🏓 Pong!\nPing: ${client.ws.ping}`);
  }
};
