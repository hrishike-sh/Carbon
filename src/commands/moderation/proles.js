const {
  Message,
  Client,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  name: 'proles',
  aliases: ['pingroles', 'pr'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message) {
    if (!message.member.roles.cache.has('824539655134773269')) {
      return message.reply('you need to be a moderator');
    }

    const annBut = new ButtonBuilder()
      .setCustomId('prole824916329848111114')
      .setEmoji('824918261086945280')
      .setStyle(ButtonStyle.Secondary);
    const nitBut = new ButtonBuilder()
      .setCustomId('prole832066859653398549')
      .setEmoji('825302229853405184')
      .setStyle(ButtonStyle.Secondary);
    const gawBut = new ButtonBuilder()
      .setCustomId('prole824916330574118942')
      .setEmoji('824918033889361941')
      .setStyle(ButtonStyle.Secondary);
    const mgawBut = new ButtonBuilder()
      .setCustomId('prole837121985787592704')
      .setEmoji('861295940785799168')
      .setStyle(ButtonStyle.Secondary);
    const hesBut = new ButtonBuilder()
      .setCustomId('prole829283902136254497')
      .setEmoji('839495312779640844')
      .setStyle(ButtonStyle.Secondary);
    const touBut = new ButtonBuilder()
      .setCustomId('prole824916330905862175')
      .setEmoji('861294809191677974')
      .setStyle(ButtonStyle.Secondary);
    const eveBut = new ButtonBuilder()
      .setCustomId('prole858088201451995137')
      .setEmoji('855684995779264542')
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents([
      annBut,
      nitBut,
      gawBut,
      mgawBut
    ]);
    const row2 = new ActionRowBuilder().addComponents([hesBut, touBut, eveBut]);

    message.channel.send({
      embeds: [
        {
          title: '**SERVER PINGS**',
          description:
            '<a:fh_announcement:824918261086945280> • <@&824916329848111114>\n' +
            '<a:fh_Nitroboostrgb:825302229853405184> • <@&832066859653398549>\n' +
            '<a:fh_giveaway:824918033889361941> • <@&824916330574118942>\n' +
            '<a:fh_freemoney:861295940785799168> • <@&837121985787592704>\n' +
            '<a:fh_pepeheist:839495312779640844> • <@&829283902136254497>\n' +
            '<a:fh_pepefight:861294809191677974> • <@&824916330905862175>\n' +
            '<a:fh_bugcatfight:855684995779264542> • <@&858088201451995137>'
        }
      ],
      components: [row1, row2]
    });
  }
};
