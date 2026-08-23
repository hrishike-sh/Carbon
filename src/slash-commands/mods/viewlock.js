const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  TextChannel,
  PermissionFlagsBits
} = require('discord.js');
const Database = require('../../database/models/timed');
const ms = require('ms');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');
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
    if (!interaction.member.roles.cache.has(config.roles.staff.cman)) {
      return interaction.reply({
        flags: 64,
        content: "You can't use this command."
      });
    }

    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');
    const time = ms(interaction.options.getString('time'));
    if (!Number.isFinite(time) || time < 30_000) {
      return interaction.reply({
        flags: 64,
        content: 'Please provide a valid duration of at least 30 seconds, such as `30m` or `2h`.'
      });
    }
    const reason = `Action requested by @${interaction.user.username} (${interaction.user.id})`;

    const timedAction = await new Database({
      when: new Date().getTime() + time,
      what: 'viewlock_timeout',
      data: {
        userId: user.id,
        channelId: channel.id,
        reason
      }
    }).save();

    try {
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: false
      });
    } catch (error) {
      await timedAction.deleteOne().catch(() => {});
      throw error;
    }

    const embed = new EmbedBuilder()
      .setTitle('Viewlock')
      .setDescription(
        `**User:** ${user}\n**Reason:** ${reason}\n**Moderator:** ${
          interaction.user
        }\n**Duration:** ~${ms(time, { long: true })}`
      )
      .setColor(Theme.success);

    await interaction.reply({ embeds: [embed] });
  }
};
