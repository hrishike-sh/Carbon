const {
  CommandInteraction,
  Client,
  EmbedBuilder,
  SlashCommandBuilder
} = require('discord.js');

module.exports = {
  category: 'Other',
  data: new SlashCommandBuilder()
    .setName(`suggest`)
    .setDescription('Suggest something you would like to see in this bot!')
    .addStringOption((opt) => {
      return opt
        .setName('suggestion')
        .setRequired(true)
        .setDescription('Your suggestion.');
    })
    .addBooleanOption((opt) => {
      return opt
        .setName('anonymous')
        .setDescription(
          'Do you want your suggestion to be anonymous? Default: false'
        )
        .setRequired(false);
    }),
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const data = {
      suggestion: interaction.options.getString('suggestion'),
      a: interaction.options.getBoolean('anonymous') || false
    };

    const suggestChannel = client.channels.cache.get(
      client.config.logs.suggestChannel
    );
    const suggestEmbed = new EmbedBuilder()
      .setDescription(data.suggestion)
      .setTimestamp()
      .setColor('Green');

    if (data.a) {
      suggestEmbed.setAuthor({
        name: `Anonymous' suggestion`
      });
    } else {
      suggestEmbed
        .setAuthor({
          name: `${interaction.user.tag}'s suggestion:`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setFooter({
          text: interaction.user.id.toString()
        });
    }

    suggestChannel.send({
      embeds: [suggestEmbed]
    });
    interaction.reply({
      content: `Your suggestion has been sent to the devs!`
    });
  }
};
