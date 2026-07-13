const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const TeamsDB = require('../../database/models/teams');
const config = require('../../config');
const {
  SHIELD_DURATION_MS,
  IMMUNITY_DURATION_MS,
  SCORE,
  ensureSummerFight,
  findTeamByName,
  hasPendingAttack,
  blockPendingAttack
} = require('../../utils/summerFight');
const { Theme, infoEmbed, successEmbed, warningEmbed, errorEmbed } = require('../../utils/embeds');

const LOOTBOX_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const OPEN_TIMEOUT_MS = 30 * 1000;
const opening = new Set();

function getLootboxCount(team, userId) {
  if (!team.lootboxes) return 0;
  if (typeof team.lootboxes.get === 'function') return team.lootboxes.get(userId) || 0;
  return team.lootboxes[userId] || 0;
}

function setLootboxCount(team, userId, amount) {
  if (!team.lootboxes || typeof team.lootboxes.set !== 'function') {
    team.lootboxes = new Map(Object.entries(team.lootboxes || {}));
  }
  team.lootboxes.set(userId, Math.max(0, amount));
}

function futureTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

function extendProtection(currentExpiry, duration) {
  const current = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  return new Date(Math.max(Date.now(), current) + duration);
}

async function applyReward(team, roll, userId) {
  ensureSummerFight(team);

  if (roll <= 27) {
    team.points += 5;
    return { description: 'Your team gained **5 points**!', color: Theme.success };
  }

  if (roll <= 42) {
    team.points += 10;
    return { description: 'Your team gained **10 points**!', color: Theme.success };
  }

  if (roll <= 57) {
    team.points -= 5;
    return { description: 'Bad luck! Your team **lost 5 points**.', color: Theme.error };
  }

  if (roll <= 69) {
    setLootboxCount(team, userId, getLootboxCount(team, userId) + 1);
    return {
      description: 'You found **another Loot Box**! Open it now with `fh lootbox`.',
      color: Theme.success
    };
  }

  if (roll <= 84) {
    team.summerFight.shieldExpiresAt = extendProtection(
      team.summerFight.shieldExpiresAt,
      SHIELD_DURATION_MS
    );
    team.summerFight.stats.shieldsUsed =
      (team.summerFight.stats.shieldsUsed || 0) + 1;

    let blockedAttack = null;
    if (hasPendingAttack(team)) {
      blockedAttack = await blockPendingAttack(team, 'shield');
    }

    return {
      description: blockedAttack
        ? `You gained a **30-minute shield** and blocked **${blockedAttack.attackerName}**'s attack!`
        : 'You gained a **30-minute shield**!',
      fields: [
        {
          name: 'Shield expires',
          value: `<t:${futureTimestamp(team.summerFight.shieldExpiresAt)}:R>`,
          inline: true
        },
        ...(blockedAttack
          ? [{ name: 'Block reward', value: `+${SCORE.SHIELD_BLOCK} points`, inline: true }]
          : [])
      ],
      color: Theme.success,
      alreadySaved: Boolean(blockedAttack)
    };
  }

  if (roll <= 87) {
    team.summerFight.immunityExpiresAt = extendProtection(
      team.summerFight.immunityExpiresAt,
      IMMUNITY_DURATION_MS
    );

    let blockedAttack = null;
    if (hasPendingAttack(team)) {
      blockedAttack = await blockPendingAttack(team, 'shield');
    }

    return {
      description: blockedAttack
        ? `Jackpot! Your team is **immune to attacks for 6 hours**, and **${blockedAttack.attackerName}**'s attack was blocked.`
        : 'Jackpot! Your team is now **immune to attacks for 6 hours**.',
      fields: [
        {
          name: 'Immunity expires',
          value: `<t:${futureTimestamp(team.summerFight.immunityExpiresAt)}:R>`,
          inline: true
        }
      ],
      color: Theme.success,
      alreadySaved: Boolean(blockedAttack)
    };
  }

  if (roll <= 95) {
    return { selectTarget: true };
  }

  return { description: 'The Loot Box was empty. Better luck next time!', color: Theme.warning };
}

async function showPointStealReward(boxMessage, team, userId) {
  const otherTeams = await TeamsDB.find({ _id: { $ne: team._id } }).sort({ name: 1 }).limit(25);

  if (!otherTeams.length) {
    team.points += 5;
    await team.save();
    return boxMessage.edit({
      embeds: [
        successEmbed({
          title: 'Loot Box opened!',
          description: 'There were no other teams to target, so your team gained **5 points** instead.',
          footer: 'Summer Fight',
          timestamp: true
        })
      ],
      components: []
    });
  }

  const customId = `lootbox-steal-${boxMessage.id}`;
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder('Select a team')
      .addOptions(
        otherTeams.map((otherTeam) => ({
          label: otherTeam.name.slice(0, 100),
          description: `${otherTeam.points} points`.slice(0, 100),
          value: otherTeam._id.toString()
        }))
      )
  );

  await boxMessage.edit({
    embeds: [
      successEmbed({
        title: 'Loot Box opened!',
        description: 'You can remove **5 points** from another team. Choose the team below.',
        footer: 'Summer Fight'
      })
    ],
    components: [row]
  });

  const collector = boxMessage.createMessageComponentCollector({
    filter: (interaction) => {
      if (interaction.customId !== customId) return false;
      if (interaction.user.id === userId) return true;

      interaction.reply({ content: 'This is not your Loot Box reward.', flags: 64 }).catch(() => {});
      return false;
    },
    time: OPEN_TIMEOUT_MS,
    max: 1
  });

  collector.on('collect', async (interaction) => {
    const target = await TeamsDB.findOne({
      _id: { $ne: team._id, $eq: interaction.values[0] }
    });

    if (!target) {
      return interaction.update({
        embeds: [errorEmbed({ title: 'Team unavailable', description: 'That team no longer exists.' })],
        components: []
      });
    }

    target.points -= 5;
    await target.save();
    await interaction.update({
      embeds: [
        successEmbed({
          title: 'Loot Box reward used!',
          description: `You removed **5 points** from **${target.name}**.`,
          footer: 'Summer Fight',
          timestamp: true
        })
      ],
      components: []
    });
  });

  collector.on('end', (collected) => {
    if (collected.size > 0) return;
    boxMessage.edit({
      embeds: [warningEmbed({ title: 'Reward expired', description: 'No team was selected in time.' })],
      components: []
    }).catch(() => {});
  });
}

module.exports = {
  name: 'luckybox',
  aliases: ['lootbox'],
  cooldown: 3,
  description: 'Open a lucky box.',

  async execute(message, args) {
    const isTester = message.author.id === config.roles.staff.owner;
    if (!isTester && message.channel.id !== config.ids.channels.event2025) return;

    const testTeamName = isTester ? args.join(' ').trim() : '';
    const team = testTeamName
      ? await findTeamByName(testTeamName)
      : await TeamsDB.findOne({ users: message.author.id });
    if (!team) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: isTester
              ? 'You are not in a team. For testing, use `fh lootbox <team name>`.'
              : 'You are not in a team.'
          })
        ]
      });
    }

    const lastOpenedAt = team.lastLb ? new Date(team.lastLb).getTime() : 0;
    const remaining = LOOTBOX_COOLDOWN_MS - (Date.now() - lastOpenedAt);
    const grantedBoxes = getLootboxCount(team, message.author.id);
    if (!isTester && grantedBoxes <= 0 && remaining > 0) {
      return message.reply({
        embeds: [
          warningEmbed({
            title: 'Loot Box unavailable',
            description: `Your team can open another Loot Box <t:${Math.floor((Date.now() + remaining) / 1000)}:R>.`
          })
        ]
      });
    }

    const customId = `lootbox-open-${message.id}`;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customId)
        .setLabel('Open Loot Box')
        .setStyle(ButtonStyle.Success)
    );

    const boxMessage = await message.reply({
      embeds: [
        infoEmbed({
          title: 'Loot Box',
          description: 'Open it to reveal your team reward.',
          footer: 'Summer Fight'
        })
      ],
      components: [row]
    });

    const collector = boxMessage.createMessageComponentCollector({
      filter: (interaction) => {
        if (interaction.customId !== customId) return false;
        if (interaction.user.id === message.author.id) return true;

        interaction.reply({
          content: 'Only the player who used `fh lootbox` can open this box.',
          flags: 64
        }).catch(() => {});
        return false;
      },
      time: OPEN_TIMEOUT_MS,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      const freshTeam = isTester
        ? await TeamsDB.findById(team._id)
        : await TeamsDB.findOne({ users: message.author.id });
      if (!freshTeam) {
        return boxMessage.edit({
          embeds: [errorEmbed({ title: 'Loot Box unavailable', description: 'Your team no longer exists.' })],
          components: []
        });
      }

      const teamId = freshTeam._id.toString();
      if (opening.has(teamId)) {
        return boxMessage.edit({
          embeds: [warningEmbed({ title: 'Loot Box opening', description: 'Your team is already opening a Loot Box.' })],
          components: []
        });
      }

      const freshLastOpenedAt = freshTeam.lastLb ? new Date(freshTeam.lastLb).getTime() : 0;
      const freshRemaining = LOOTBOX_COOLDOWN_MS - (Date.now() - freshLastOpenedAt);
      const freshGrantedBoxes = getLootboxCount(freshTeam, message.author.id);
      if (!isTester && freshGrantedBoxes <= 0 && freshRemaining > 0) {
        return boxMessage.edit({
          embeds: [
            warningEmbed({
              title: 'Loot Box already opened',
              description: `Your team can open another Loot Box <t:${Math.floor((Date.now() + freshRemaining) / 1000)}:R>.`
            })
          ],
          components: []
        });
      }

      opening.add(teamId);

      try {
        if (!isTester && freshGrantedBoxes > 0) {
          setLootboxCount(freshTeam, message.author.id, freshGrantedBoxes - 1);
        } else if (!isTester) {
          freshTeam.lastLb = new Date();
        }

        const reward = await applyReward(
          freshTeam,
          Math.floor(Math.random() * 100) + 1,
          message.author.id
        );
        if (!reward.alreadySaved) await freshTeam.save();

        if (reward.selectTarget) {
          await showPointStealReward(boxMessage, freshTeam, message.author.id);
          return;
        }

        await boxMessage.edit({
          embeds: [
            successEmbed({
              title: 'Loot Box opened!',
              description: reward.description,
              fields: reward.fields,
              color: reward.color,
              footer: 'Summer Fight',
              timestamp: true
            }).setColor(reward.color)
          ],
          components: []
        });
      } catch (error) {
        console.error('Loot Box error:', error);
        await boxMessage.edit({
          embeds: [errorEmbed({ title: 'Loot Box error', description: 'The reward could not be opened. Please try again.' })],
          components: []
        }).catch(() => {});
      } finally {
        opening.delete(teamId);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size > 0) return;
      boxMessage.edit({
        embeds: [warningEmbed({ title: 'Loot Box expired', description: 'The Loot Box was not opened in time.' })],
        components: []
      }).catch(() => {});
    });
  }
};
