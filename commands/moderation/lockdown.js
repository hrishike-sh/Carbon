const db = require('../../database/models/settingsSchema');
const {
  ButtonBuilder,
  ActionRowBuilder,
  Message,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'lockdown',
  category: 'Moderation',
  /**
   * @param {Message} message
   * @returns
   */
  async execute(message) {
    if (!message.member.permissions.has('BanMembers'))
      return message.channel.send(
        `You must have the BAN_MEMBERS permission to run this command`
      );

    const server = await db.findOne({ guildID: message.guild.id });

    if (!server || !server.lockdownSet.channels)
      return message.channel.send(
        `This server has not yet set the channels that are supposed to be locked down.\nCheck \`fh lds\` for more info.`
      );

    const yesbut = new ButtonBuilder()
      .setLabel('Yes')
      .setStyle(ButtonStyle.Success)
      .setCustomId('lock-yes');
    const nobut = new ButtonBuilder()
      .setLabel('No')
      .setStyle(ButtonStyle.Danger)
      .setCustomId('lock-no');
    const row1 = new ActionRowBuilder().addComponents([yesbut, nobut]);

    const confirm = await message.channel.send({
      components: [row1],
      content: `Are you sure you want to lockdown?`
    });

    const collectorC = confirm.createMessageComponentCollector({
      time: 30000,
      max: 1
    });

    collectorC.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        button.reply({
          content: `This is not for you`,
          ephemeral: true
        });
        return;
      }

      const id = button.customId;

      if (id === 'lock-no') {
        collectorC.stop();
        await confirm.edit({
          components: [
            new ActionRowBuilder({
              components: [yesbut.setDisabled(true), nobut.setDisabled(true)]
            })
          ]
        });
        await button.reply({
          content: 'I guess not.',
          ephemeral: true
        });
        return;
      }
      button.deferUpdate();
      const channels = server.lockdownSet.channels;

      for (const channel of channels) {
        const toLockChannel = message.guild.channels.cache.get(channel);

        toLockChannel.permissionOverwrites.edit(
          message.channel.guild.roles.everyone,
          {
            SendMessages: false
          }
        );

        toLockChannel.send({
          embeds: [
            {
              title: ':lock: **SERVER LOCKDOWN**',
              description:
                server.lockdownSet.message || 'The server is currently locked.',
              timestamp: new Date()
            }
          ]
        });
      }

      await confirm.edit({
        components: [
          new ActionRowBuilder({
            components: [yesbut.setDisabled(true), nobut.setDisabled(true)]
          })
        ]
      });
      await button.reply({
        content: 'Done, the server is now on lockdown.'
      });
    });
  }
};
