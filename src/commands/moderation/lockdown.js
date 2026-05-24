const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { warningEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'lockdown',

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You must be an administrator to use this command.');
    }

    const channelList = ['833727597057802240'];

    const filter = (m) => m.author.id === message.author.id;

    message.reply({
      embeds: [
        warningEmbed({
          title: 'Lockdown Confirm',
          description: 'Are you sure you want to lock down the server?',
          footer: 'Type `yes` or `no`'
        })
      ]
    });

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
                errorEmbed({ title: 'Server is under lockdown' })
              ]
            });
          }
        }
        message.reply({
          embeds: [
            successEmbed({ title: 'Lockdown Initiated' })
          ]
        });
      } else {
        message.reply({
          embeds: [
            warningEmbed({ title: 'Lockdown Cancelled' })
          ]
        });
      }
    } catch (error) {
      message.reply({
        embeds: [
          warningEmbed({
            title: 'No response received. Lockdown cancelled.'
          })
        ]
      });
    }
  }
};
