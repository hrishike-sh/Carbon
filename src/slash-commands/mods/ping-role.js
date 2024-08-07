const {
  SlashCommandBuilder,
  Client,
  CommandInteraction
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('pingrole').addStringOption((str) =>
    str
      .setChoices([
        {
          name: 'Giveaway Ping',
          value: 'Minimum amount: 100,000,000 Ping Cooldown: 30 minutes / ping'
        },
        {
          name: 'Event Ping',
          value: 'Minimum amount: 100,000,000 Ping Cooldown: 30 minutes / ping'
        },
        {
          name: 'Mini Gaw and Event Ping',
          value: 'Minimum amount: 25,000,000 Ping Cooldown: 30 minutes / ping'
        },
        {
          name: 'Mafia Ping',
          value: 'Minimum amount: 100,000,000 Ping Cooldown: 30 minutes / ping'
        }
      ])
      .setDescription('Ping roles!')
  ),
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const member = interaction.member;

    const roles = [
      '824348974449819658', // admin
      '1016728636365209631', // cman
      '824539655134773269', // mod
      '858088054942203945', // giveaway manager
      '858088054942203945' // event manager
    ];

    if (!member.roles.cache.hasAny(...roles)) {
      return interaction.reply("You can't run this command!");
    } else {
      return interaction.reply('You can run this command!');
    }
  }
};
