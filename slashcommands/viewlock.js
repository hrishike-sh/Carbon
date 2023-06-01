const {
  CommandInteraction,
  EmbedBuilder,
  Client,
  TextChannel,
  SlashCommandBuilder
} = require('discord.js');

module.exports = {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('viewlock')
    .setDescription('Viewlock a channel for a user or role or everyone.')
    .addChannelOption((option) => {
      return option
        .setName('channel')
        .setDescription('The channel you want to viewlock')
        .setRequired(true);
    })
    .addUserOption((opt) => {
      return opt
        .setName('user')
        .setDescription(
          'The user you want to viewlock for the channel you have selected.'
        )
        .setRequired(false);
    })
    .addRoleOption((opt) => {
      return opt
        .setName('role')
        .setDescription(
          'The role you want to viewlock for the channel you have selected.'
        )
        .setRequired(false);
    }),
  /**
   * @param {CommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const data = {
      channel: interaction.options.getChannel('channel'),
      user: interaction.options.getUser('user') || null,
      role: interaction.options.getRole('role') || null
    };

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: `You must have the \`ADMINISTRATOR\` permission to run this command.`,
        ephemeral: true
      });
    }

    const channel = data.channel;
    if (channel.type !== 'GUILD_TEXT')
      return interaction.reply({
        content: "Make sure it's a text channel."
      });

    try {
      if (data.user) {
        channel.permissionOverwrites.edit(data.user.id, {
          ViewChannel: false
        });

        return interaction.reply({
          content: `${channel.toString()} has been viewlocked for ${data.user.toString()}!`
        });
      } else if (data.role) {
        channel.permissionOverwrites.edit(data.role.id, {
          ViewChannel: false
        });

        return interaction.reply({
          content: `${channel.toString()} has been viewlocked for role \`${
            data.role.name
          }\`.`
        });
      } else {
        channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
          ViewChannel: false
        });

        return interaction.reply({
          content: `${channel.toString()} is now viewlocked for \`@everyone\`.`
        });
      }
    } catch (e) {
      return interaction.reply({
        content: `An error occured!\n\n${e.message}`
      });
    }
  }
};
