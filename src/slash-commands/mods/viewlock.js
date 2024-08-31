const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  TextChannel,
  PermissionFlagsBits
} = require('discord.js');
const Database = require('../../database/timed');
const ms = require('ms');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('t-viewlock')
    .setDescription('Temporarily viewlock a member from a channel.')
    .addUserOption((user) => {
      return user
        .setName('user')
        .setDescription('The user you want to viewlock')
        .setRequired(true);
    })
    .addChannelOption((channel) => {
      return channel
        .setName('channel')
        .setDescription('The channel you want to viewlock')
        .setRequired(true);
    })
    .addStringOption((time) => {
      return time
        .setName('time')
        .setDescription('Amount of time the user should be viewlocked.')
        .setRequired(true);
    }),
  /**
   *
   * @param {CommandInteraction} interaction int
   */
  async execute(interaction) {
    const client = interaction.client;
    if (!interaction.member.roles.cache.has('1016728636365209631')) {
      return interaction.reply({
        ephemeral: true,
        content: "You can't use this command."
      });
    }

    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');
    const time = require('ms')(interaction.options.getString('time'));
    const reason = `Action requested by ${interaction.user.username} (${interaction.user.id})`;

    await channel.permissionOverwrites.set(
      [
        {
          id: user.id,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
          ]
        }
      ],
      reason
    );

    await new Database({
      when: new Date().getTime() + time,
      what: 'viewlock_timeout',
      data: {
        userId: user.id,
        channelId: channel.id,
        reason
      }
    }).save();

    const embed = new EmbedBuilder()
      .setTitle('Viewlock')
      .setDescription(
        `**User:** ${user}\n**Reason:** ${reason}\n**Moderator:** @${
          interaction.user
        }\n**Duration:** ${ms(time)}`
      )
      .setColor('Green');

    await interaction.reply({ embeds: [embed] });
  }
};
