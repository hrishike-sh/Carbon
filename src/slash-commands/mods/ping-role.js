const {
  SlashCommandBuilder,
  Client,
  CommandInteraction
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Ping roles!')
    .addStringOption((str) => {
      return str
        .setName('role')
        .setDescription('Ping Cooldown: 30 minutes / role')
        .addChoices(
          {
            name: 'Giveaway Ping',
            value: '824916330574118942'
          },
          {
            name: 'Event Ping',
            value: '858088201451995137'
          },
          {
            name: 'Mini Gaw and Event Ping',
            value: '837121985787592704'
          },
          {
            name: 'Mafia Ping',
            value: '1154432845318721607'
          }
        )
        .setRequired(true);
    }),
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
