const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const {
  TICKET_PRICE,
  chanceText,
  getCurrentRoundSnapshot
} = require('../../services/lotteryService');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'lottery',
  description: 'View your current server-pool lottery tickets.',
  cooldown: 3,

  async execute(message, args) {
    const subcommand = (args.shift() || '').toLowerCase();
    if (subcommand !== 'view') {
      return message.reply(
        `Use \`fh lottery view\` to see your tickets and winning chance.`
      );
    }

    const snapshot = await getCurrentRoundSnapshot(message.author.id);
    const drawTimestamp = Math.floor(
      snapshot.round.scheduledDrawAt.getTime() / 1000
    );

    const embed = new EmbedBuilder()
      .setColor(Theme.info)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL()
      })
      .setTitle('Server Pool Lottery')
      .setDescription(
        `Every **\u23e3 ${TICKET_PRICE.toLocaleString()}** donated to the server pool earns one ticket.`
      )
      .addFields(
        {
          name: 'Your Donations',
          value: `\u23e3 ${snapshot.user.donated.toLocaleString()}`,
          inline: true
        },
        {
          name: 'Your Tickets',
          value: snapshot.user.tickets.toLocaleString(),
          inline: true
        },
        {
          name: 'Winning Chance',
          value: chanceText(snapshot.user.tickets, snapshot.totalTickets),
          inline: true
        },
        {
          name: 'Current Pool',
          value: `\u23e3 ${snapshot.round.totalPool.toLocaleString()}`,
          inline: true
        },
        {
          name: 'Winner Receives',
          value: `\u23e3 ${snapshot.prizeAmount.toLocaleString()} (95%)`,
          inline: true
        },
        {
          name: 'Next Draw',
          value: `<t:${drawTimestamp}:F>\n<t:${drawTimestamp}:R>`,
          inline: true
        }
      )
      .setFooter({ text: 'Draws happen at 12 AM and 12 PM IST' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('lottery:top10')
        .setLabel('View Top 10')
        .setEmoji('\ud83c\udf9f\ufe0f')
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }
};
