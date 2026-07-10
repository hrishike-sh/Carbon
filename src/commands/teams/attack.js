const {
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const { infoEmbed, successEmbed, warningEmbed, errorEmbed } = require('../../utils/embeds');
const TeamDB = require('../../database/models/teams');
const {
  ATTACKS_PER_WINDOW,
  ATTACK_WINDOW_MS,
  BLOCK_WINDOW_MS,
  SCORE,
  findTeamByUser,
  findTeamByName,
  ensureSummerFight,
  isShieldActive,
  resetAttackWindow,
  hasPendingAttack,
  resolveExpiredAttack,
  scheduleAttackResolution
} = require('../../utils/summerFight');

async function runAttack(message, targetTeam, client) {
  const attackerTeam = await findTeamByUser(message.author.id);
  if (!attackerTeam) {
    return message.reply({ embeds: [errorEmbed({ description: 'You are not in a team.' })] });
  }

  ensureSummerFight(targetTeam);

  if (attackerTeam._id.equals(targetTeam._id)) {
    return message.reply({
      embeds: [errorEmbed({ title: 'Attack unavailable', description: 'You cannot attack your own team.' })]
    });
  }

  await resolveExpiredAttack(targetTeam, message.channel);

  if ((targetTeam.lives ?? 5) <= 0) {
    return message.reply({
      embeds: [warningEmbed({ title: 'Attack unavailable', description: `**${targetTeam.name}** has no lives left.` })]
    });
  }

  resetAttackWindow(attackerTeam);

  if (attackerTeam.summerFight.attacksUsed >= ATTACKS_PER_WINDOW) {
    const resetAt =
      new Date(attackerTeam.summerFight.attackWindowStartedAt).getTime() +
      ATTACK_WINDOW_MS;
    return message.reply({
      embeds: [
        warningEmbed({
          title: 'Attack limit reached',
          description: `Your team has used all **${ATTACKS_PER_WINDOW}** attacks. They reset <t:${Math.floor(resetAt / 1000)}:R>.`
        })
      ]
    });
  }

  if (hasPendingAttack(targetTeam)) {
    return message.reply({
      embeds: [warningEmbed({ title: 'Attack unavailable', description: `**${targetTeam.name}** is already under attack.` })]
    });
  }

  attackerTeam.summerFight.attacksUsed += 1;

  if (isShieldActive(targetTeam)) {
    attackerTeam.points += SCORE.FAILED_ATTACK;
    attackerTeam.summerFight.stats.attacksFailed =
      (attackerTeam.summerFight.stats.attacksFailed || 0) + 1;
    targetTeam.points += SCORE.SHIELD_BLOCK;
    targetTeam.summerFight.stats.shieldBlocks =
      (targetTeam.summerFight.stats.shieldBlocks || 0) + 1;

    await attackerTeam.save();
    await targetTeam.save();

    const shieldEnds = Math.floor(
      new Date(targetTeam.summerFight.shieldExpiresAt).getTime() / 1000
    );
    return message.channel.send({
      embeds: [
        warningEmbed({
          title: 'Attack blocked by shield',
          description: `**${targetTeam.name}**'s shield stopped **${attackerTeam.name}**'s attack.`,
          fields: [
            { name: 'Shield expires', value: `<t:${shieldEnds}:R>`, inline: true },
            { name: `${targetTeam.name} earned`, value: `+${SCORE.SHIELD_BLOCK} points`, inline: true },
            { name: `${attackerTeam.name} lost`, value: `${Math.abs(SCORE.FAILED_ATTACK)} points`, inline: true }
          ],
          footer: 'Summer Fight',
          timestamp: true
        })
      ]
    });
  }

  targetTeam.summerFight.pendingAttack = {
    attackerTeamId: attackerTeam._id,
    attackerTeamName: attackerTeam.name,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + BLOCK_WINDOW_MS),
    channelId: message.channel.id
  };

  await attackerTeam.save();
  await targetTeam.save();

  scheduleAttackResolution(client, targetTeam._id, message.channel.id);

  const expiresAt = Math.floor(
    new Date(targetTeam.summerFight.pendingAttack.expiresAt).getTime() / 1000
  );
  return message.channel.send({
    embeds: [
      infoEmbed({
        title: 'Surprise attack launched!',
        description: `**${attackerTeam.name}** is attacking **${targetTeam.name}**.`,
        fields: [
          { name: 'Defend now', value: `Use \`fh block\` before <t:${expiresAt}:R>.`, inline: false },
          {
            name: 'Attacks remaining',
            value: `${ATTACKS_PER_WINDOW - attackerTeam.summerFight.attacksUsed}/${ATTACKS_PER_WINDOW}`,
            inline: true
          }
        ],
        footer: 'Summer Fight',
        timestamp: true
      })
    ]
  });
}

async function sendTeamSelect(message, client) {
  const attackerTeam = await findTeamByUser(message.author.id);
  if (!attackerTeam) {
    return message.reply({ embeds: [errorEmbed({ description: 'You are not in a team.' })] });
  }

  resetAttackWindow(attackerTeam);
  if (attackerTeam.summerFight.attacksUsed >= ATTACKS_PER_WINDOW) {
    const resetAt =
      new Date(attackerTeam.summerFight.attackWindowStartedAt).getTime() +
      ATTACK_WINDOW_MS;
    return message.reply({
      embeds: [
        warningEmbed({
          title: 'Attack limit reached',
          description: `Your team has used all **${ATTACKS_PER_WINDOW}** attacks. They reset <t:${Math.floor(resetAt / 1000)}:R>.`
        })
      ]
    });
  }

  const teams = await TeamDB.find({
    _id: { $ne: attackerTeam._id },
    $or: [{ lives: { $gt: 0 } }, { lives: { $exists: false } }]
  }).sort({ name: 1 });

  if (!teams.length) {
    return message.reply({
      embeds: [warningEmbed({ title: 'No targets found', description: 'There are no teams available to attack.' })]
    });
  }

  const visibleTeams = teams.slice(0, 25);
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`summer-attack-${message.author.id}`)
      .setPlaceholder('Select a team to attack')
      .addOptions(
        visibleTeams.map((team) => ({
          label: team.name.slice(0, 100),
          description: `${team.points} points, ${team.lives ?? 5} lives`.slice(0, 100),
          value: team._id.toString()
        }))
      )
  );

  const selectMessage = await message.reply({
    embeds: [
      infoEmbed({
        title: 'Choose a target',
        description:
          teams.length > 25
            ? 'Select a team to attack. Showing the first 25 teams alphabetically.'
            : 'Select a team to attack.',
        fields: [
          {
            name: 'Attacks available',
            value: `${ATTACKS_PER_WINDOW - attackerTeam.summerFight.attacksUsed}/${ATTACKS_PER_WINDOW}`,
            inline: true
          }
        ],
        footer: 'Summer Fight'
      })
    ],
    components: [row]
  });

  const collector = selectMessage.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    idle: 30_000,
    max: 1
  });

  collector.on('collect', async (interaction) => {
    const targetTeam = await TeamDB.findById(interaction.values[0]);
    await interaction.update({
      embeds: [
        targetTeam
          ? successEmbed({ title: 'Target selected', description: `Preparing an attack on **${targetTeam.name}**.` })
          : errorEmbed({ title: 'Target unavailable', description: 'That team no longer exists.' })
      ],
      components: []
    });

    if (!targetTeam) return;
    await runAttack(message, targetTeam, client);
  });

  collector.on('end', (collected, reason) => {
    if (reason === 'idle') {
      selectMessage.edit({
        embeds: [warningEmbed({ title: 'Attack cancelled', description: 'No team was selected in time.' })],
        components: []
      }).catch(() => {});
    }
  });
}

module.exports = {
  name: 'attack',
  aliases: ['surpriseattack'],
  cooldown: 5,

  async execute(message, args, client) {
    const targetName = args.join(' ').trim();
    if (!targetName) return sendTeamSelect(message, client);

    const targetTeam = await findTeamByName(targetName);
    if (!targetTeam) {
      return message.reply({
        embeds: [errorEmbed({ title: 'Target unavailable', description: 'That team does not exist.' })]
      });
    }

    return runAttack(message, targetTeam, client);
  }
};
