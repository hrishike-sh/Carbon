const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'nop',
  aliases: ['noping', 'nopings'],
  description: 'you dont need to know',
  fhOnly: true,
  category: 'Other',
  async execute(message, args) {
    if (
      !message.member.roles.cache.some(
        (role) => role.id === '824348974449819658'
      ) &&
      !message.member.roles.cache.some(
        (role) => role.id === '839857042810601492'
      ) &&
      message.author.id !== '598918643727990784'
    ) {
      message.channel.send(
        'You need the `・ Administrator` role to perform this action.'
      );
      return;
    }

    const embed = {
      title: '**__PARTNER PINGS__**',
      description:
        '<a:fh_partner:861299771612594196> • <@&826946297151094814>\n' +
        '<a:fh_nono:824904307337723905> • <@&838100741121900625>\n' +
        '<:fh_pandaheist:861300228803002368> • <@&824916332230737940>'
    };

    const annBut = new ButtonBuilder()
      .setCustomId('par_ping')
      .setEmoji('861299771612594196')
      .setStyle(ButtonStyle.Secondary);
    const nitBut = new ButtonBuilder()
      .setCustomId('no_par_ping')
      .setEmoji('824904307337723905')
      .setStyle(ButtonStyle.Secondary);
    const gawBut = new ButtonBuilder()
      .setCustomId('par_hes_ping')
      .setEmoji('861300228803002368')
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents([annBut, nitBut, gawBut]);

    message.channel.send({
      embeds: [embed],
      components: [row1]
    });
  }
};
