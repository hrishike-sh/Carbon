const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'lockdown',

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You must be an administrator to use this command.');
    }

    const channelList = ['833727597057802240'];

    const filter = (m) => m.author.id === message.author.id;
    const embed = new EmbedBuilder()
      .setTitle('Lockdown Confirm')
      .setDescription('Are you sure you want to lock down the server?')
      .setFooter({ text: 'Type `yes` or `no`' })
      .setColor('Yellow');

    message.reply({ embeds: [embed] });

    try {
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ['time']
      });
      const response = collected.first().content.toLowerCase();

      if (response === 'yes') {
        for (const channelId of channelList) {
          const channel = message.guild.channels.cache.get(channelId);
          if (channel) {
            await channel.permissionOverwrites.edit(
              message.guild.roles.everyone,
              { SendMessages: false }
            );
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle('Server is under lockdown')
                  .setColor('Red')
              ]
            });
          }
        }
        message.reply({
          embeds: [
            new EmbedBuilder().setTitle('Lockdown Initiated').setColor('Green')
          ]
        });
      } else {
        message.reply({
          embeds: [
            new EmbedBuilder().setTitle('Lockdown Cancelled').setColor('Yellow')
          ]
        });
      }
    } catch (error) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('No response received. Lockdown cancelled.')
            .setColor('Yellow')
        ]
      });
    }
  }
};
