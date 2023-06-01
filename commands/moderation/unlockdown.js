const db = require('../../database/models/settingsSchema');
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'unlockdown',
  category: 'Moderation',
  async execute(message, args) {
    if (!message.member.permissions.has('BAN_MEMBERS'))
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
      content: `Are you sure you want to unlock the server?`
    });

    const collectorC = confirm.createMessageComponentCollector((b) => b, {
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
        confirm.delete();
        return message.channel.send(`I guess not.`);
      } else if (id === 'lock-yes') {
        const channels = server.lockdownSet.channels;

        for (const channel of channels) {
          const toLockChannel = message.guild.channels.cache.get(channel);

          toLockChannel.permissionOverwrites.edit(
            message.channel.guild.roles.everyone,
            {
              SendMessages: null
            }
          );

          toLockChannel.send({
            embeds: [
              {
                title: ':unlock: **SERVER UNLOCKED**',
                description: `The server is now unlocked.`,
                timestamp: new Date()
              }
            ]
          });
        }

        message.channel.send(`Done, the server is now unlocked!`);
      }
    });
  }
};
