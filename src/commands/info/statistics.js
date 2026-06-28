const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const { CommandStatsService } = require('../../database/services/commandStatsService');
const { Theme } = require('../../utils/embeds');

const PERIODS = ['daily', 'weekly', 'monthly'];

function makeBarGraph(rows) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return rows
    .map((row) => {
      const width = row.value === 0 ? 0 : Math.max(1, Math.round((row.value / max) * 18));
      const bar = '#'.repeat(width).padEnd(18, '.');
      return `${row.label.padEnd(14, ' ')} | ${bar} ${row.value.toLocaleString()}`;
    })
    .join('\n');
}

function formatTopCommands(commands) {
  if (!commands.length) return 'No commands recorded yet.';
  return commands
    .map((command, index) => {
      return `${index + 1}. ${command.name} - ${command.uses.toLocaleString()}`;
    })
    .join('\n');
}

function buildButtons(activePeriod) {
  return new ActionRowBuilder().addComponents(
    PERIODS.map((period) =>
      new ButtonBuilder()
        .setCustomId(`stats_${period}`)
        .setLabel(period[0].toUpperCase() + period.slice(1))
        .setStyle(period === activePeriod ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(period === activePeriod)
    )
  );
}

async function buildStatsPayload(message, period) {
  const usage = await CommandStatsService.getUsage({
    guildId: message.guild.id,
    period
  });

  const embed = new EmbedBuilder()
    .setTitle('Command Stats')
    .setColor(Theme.info)
    .setDescription(`\`\`\`\n${makeBarGraph(usage.buckets)}\n\`\`\``)
    .addFields(
      {
        name: 'Total',
        value: usage.total.toLocaleString(),
        inline: true
      },
      {
        name: 'Prefix',
        value: usage.prefixTotal.toLocaleString(),
        inline: true
      },
      {
        name: 'Slash',
        value: usage.slashTotal.toLocaleString(),
        inline: true
      },
      {
        name: 'Top Commands',
        value: formatTopCommands(usage.topCommands)
      }
    )
    .setFooter({ text: `${usage.period} view` })
    .setTimestamp();

  return {
    embeds: [embed],
    components: [buildButtons(period)]
  };
}

module.exports = {
  name: 'statistics',
  aliases: ['stats', 'commandstats', 'cmdstats'],
  cooldown: 5,

  async execute(message) {
    let activePeriod = 'daily';
    const statsMessage = await message.reply(await buildStatsPayload(message, 'daily'));

    const collector = statsMessage.createMessageComponentCollector({
      filter: (interaction) => {
        if (interaction.user.id === message.author.id) return true;
        interaction.reply({
          content: 'Run `fh stats` to use your own stats buttons.',
          flags: 64
        });
        return false;
      },
      idle: 120000
    });

    collector.on('collect', async (interaction) => {
      const period = interaction.customId.replace('stats_', '');
      if (!PERIODS.includes(period)) return interaction.deferUpdate();
      activePeriod = period;
      return interaction.update(await buildStatsPayload(message, period));
    });

    collector.on('end', () => {
      const row = buildButtons(activePeriod);
      row.components.forEach((button) => button.setDisabled(true));
      statsMessage.edit({ components: [row] }).catch(() => {});
    });
  }
};
