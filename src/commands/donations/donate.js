const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

const DESTINATIONS = {
  '857223712193511434': {
    type: 'Event', roleId: config.roles.giveawayManager,
    fields: ['Prize', 'Requirement', 'Type of Event', 'Message'],
    usage: 'fh donate <prize>, <requirement>, <event type>, <optional message>'
  },
  '824319140763795457': {
    type: 'Giveaway', roleId: '825783847622934549',
    fields: ['Time', 'Winners', 'Requirement', 'Prize', 'Message'],
    usage: 'fh donate <time>, <winners>, <requirement>, <prize>, <optional message>'
  }
};

module.exports = {
  name: 'donate',
  cooldown: 30,
  async execute(message, args) {
    const destination = DESTINATIONS[message.channel.id];
    if (!destination) return message.reply("You can't run this command here.");
    const values = args.join(' ').split(',').map((value) => value.trim());
    const required = destination.fields.length - 1;
    if (values.length < required || values.slice(0, required).some((value) => !value)) {
      return message.reply(`**Usage:** \`${destination.usage}\`\nSeparate the arguments with commas.`);
    }
    values[required] = values.slice(required).join(', ') || 'None';
    if (values.slice(0, required + 1).some((value) => value.length > 1024)) {
      return message.reply('Each donation field must contain at most 1,024 characters.');
    }
    const embed = new EmbedBuilder()
      .setTitle(`${destination.type} Donation`)
      .setColor(Theme.info)
      .setTimestamp()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setFooter({ text: 'You will receive a DM when a manager accepts your donation. Requests expire after 24 hours.' })
      .addFields(destination.fields.map((name, index) => ({ name, value: values[index], inline: true })));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Accept').setStyle(ButtonStyle.Success).setCustomId('donate_accept'),
      new ButtonBuilder().setLabel('Deny').setStyle(ButtonStyle.Danger).setCustomId('donate_deny')
    );
    const mainMessage = await message.channel.send({
      content: `<@&${destination.roleId}>, ${message.author} would like to make a donation!`,
      allowedMentions: { roles: [destination.roleId], users: [message.author.id] },
      embeds: [embed], components: [row]
    });
    const collector = mainMessage.createMessageComponentCollector({ time: 24 * 60 * 60 * 1000 });
    let handled = false;
    collector.on('collect', async (button) => {
      let reserved = false;
      let acknowledged = false;
      try {
        if (!button.member?.roles?.cache?.has(destination.roleId)) {
          await button.reply({ content: `You need the <@&${destination.roleId}> role to accept or deny donations.`, flags: 64 });
          return;
        }
        if (handled) {
          await button.reply({ content: 'This request has already been handled.', flags: 64 });
          return;
        }
        handled = true;
        reserved = true;
        await button.deferReply();
        acknowledged = true;
        collector.stop('handled');
        const accepted = button.customId === 'donate_accept';
        const dmContent = accepted
          ? `${button.user} has accepted your ${destination.type} Donation! Please check <#${message.channel.id}>.`
          : `Your ${destination.type.toLowerCase()} donation has been denied. Please check <#${message.channel.id}>.`;
        const notified = await message.author.send({ content: dmContent }).then(() => true, () => false);
        await button.editReply({ content: notified
          ? 'The donor has been notified. Please wait for them.'
          : 'The request was handled, but I could not DM the donor. Please contact them in this channel.' });
      } catch (error) {
        if (reserved && !acknowledged) handled = false;
        console.error('Donation request interaction failed:', error);
      }
    });
    collector.on('end', () => {
      row.components.forEach((button) => button.setDisabled(true));
      mainMessage.edit({ components: [row] }).catch(() => {});
    });
  }
};
