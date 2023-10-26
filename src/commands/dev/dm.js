const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'dm',
  description: 'DM a user',
  async execute(interaction) {

    if(!interaction.member.roles.cache.has('1016728636365209631')) {
      return interaction.reply({content: "You do not have permission to use this command!", ephemeral: true});
    }

    const user = interaction.options.getUser('user');
    if(!user) return interaction.reply({content: "Please specify a user to DM!", ephemeral: true});

    const content = interaction.options.getString('content');
    if(!content) return interaction.reply({content: "Please specify a DM message!", ephemeral: true});

    const anonymous = interaction.options.getBoolean('anonymous');

    const embed = new MessageEmbed()
      .setDescription(`Message: ${content}`)
      .setTimestamp();

    if(!anonymous) {
      embed.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL());
    }

    try {
      await user.send({ embeds: [embed] });
      await interaction.reply({content: "DM sent!", ephemeral: true});
    } catch(err) {
      interaction.reply({content: "Could not DM that user!", ephemeral: true});
    }

  }
}
