const { Message, Client, Permissions } = require('discord.js');

module.exports = {
  name: 'lockdown',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return message.reply('You must be an administrator to use this command.');
    }

    const channelList = ['833727597057802240'];

    const filter = (m) => m.author.id === message.author.id;
    const embed = new MessageEmbed()
      .setTitle('Lockdown Confirm')
      .setDescription('Are you sure you want to lock down the server?')
      .setFooter('Type `yes` or `no`')
      .setColor('YELLOW');

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
              {
                SEND_MESSAGES: false
              }
            );
            await channel.send({
              embeds: [
                new MessageEmbed()
                  .setTitle('Server is under lockdown')
                  .setColor('RED')
              ]
            });
          }
        }
        message.reply({
          embeds: [
            new MessageEmbed().setTitle('Lockdown Initiated').setColor('GREEN')
          ]
        });
      } else {
        message.reply({
          embeds: [
            new MessageEmbed().setTitle('Lockdown Cancelled').setColor('YELLOW')
          ]
        });
      }
    } catch (error) {
      message.reply({
        embeds: [
          new MessageEmbed()
            .setTitle('No response received. Lockdown cancelled.')
            .setColor('YELLOW')
        ]
      });
    }
  }
};
