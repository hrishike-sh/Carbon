const { EmbedBuilder, MessageFlags } = require('discord.js');
const {
  chanceText,
  getCurrentRoundSnapshot
} = require('../../services/lotteryService');
const { Theme } = require('../../utils/embeds');
const logger = require('../../utils/logger');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isButton() || interaction.customId !== 'lottery:top10') {
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const snapshot = await getCurrentRoundSnapshot(interaction.user.id);
      const topTen = snapshot.entries
        .filter((entry) => entry.tickets > 0)
        .slice(0, 10);

      const description = topTen.length
        ? topTen
            .map(
              (entry, index) =>
                `**${index + 1}.** <@${entry.userId}> — ` +
                `**${entry.tickets.toLocaleString()}** ticket(s) — ` +
                `${chanceText(entry.tickets, snapshot.totalTickets)}`
            )
            .join('\n')
        : 'No eligible tickets have been recorded in this round yet.';

      const embed = new EmbedBuilder()
        .setColor(Theme.info)
        .setTitle('Lottery Top 10')
        .setDescription(description)
        .addFields(
          {
            name: 'Total Tickets',
            value: snapshot.totalTickets.toLocaleString(),
            inline: true
          },
          {
            name: 'Total Pool',
            value: `\u23e3 ${snapshot.round.totalPool.toLocaleString()}`,
            inline: true
          },
          {
            name: 'Your Chance',
            value: chanceText(snapshot.user.tickets, snapshot.totalTickets),
            inline: true
          }
        )
        .setTimestamp();

      return interaction.editReply({
        embeds: [embed],
        allowedMentions: { users: [] }
      });
    } catch (error) {
      logger.error('Lottery top 10 interaction error', error);
      return interaction.editReply({
        content: 'I could not load the lottery standings right now.'
      });
    }
  }
};
