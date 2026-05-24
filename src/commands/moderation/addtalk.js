const {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'addtalk',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    const allowedRoles = [
      config.roles.giveawayManager,
      config.roles.staff.admin,
      config.roles.staff.mod
    ];
    const talkRole = '880014639142936586';

    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message.reply('You cannot use this command!');
    }

    if (!message.reference?.messageId) {
      return message.reply('Please reply to the target message!');
    }

    const target = await message.channel.messages.fetch(
      message.reference.messageId
    );
    if (target?.mentions?.members <= 1) {
      return message.reply(`No mentions found in the message!`);
    }

    const embed = new EmbedBuilder()
      .setTitle('Add speakable')
      .setFooter({
        text: `Requested by: ${message.author.tag}`
      })
      .setColor(Theme.warning);

    const mentions = target.mentions.members;
    embed.setDescription(
      `This will add the <@&${talkRole}> to ${mentions.map(
        (a) => `<@${a.user.id}>`
      )}`
    );

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId('yes')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('no')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    ]);

    const confirmationMessage = await message.reply({
      embeds: [embed],
      components: [row.toJSON()]
    });

    const collector = confirmationMessage.createMessageComponentCollector({
      filter: (m) => m.user.id == message.author.id,
      idle: 30 * 1000,
      max: 1
    });

    collector.on('collect', async (button) => {
      if (button.customId == 'yes') {
        embed.setColor(Theme.success);
        embed.setDescription('Adding roles...');

        for await (const [_, member] of mentions) {
          member.roles.add(talkRole);
        }

        message.channel.send(
          `Added <@&${talkRole}> to ${mentions.size} members!`
        );
      } else {
        embed.setColor(Theme.error);
        embed.setDescription(
          `~~${embed.data.description}~~\n\n**Action cancelled**`
        );
        confirmationMessage.edit({
          embeds: [embed],
          components: null
        });
      }
    });
  }
};
