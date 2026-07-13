const TeamDB = require('../../database/models/teams');
const { infoEmbed } = require('../../utils/embeds');
const {
  ATTACKS_PER_WINDOW,
  SHIELDS_PER_DAY,
  cleanTeamName,
  ensureSummerFight,
  resetAttackWindow,
  resetShieldUses,
  hasPendingAttack
} = require('../../utils/summerFight');

const MAX_DESCRIPTION_LENGTH = 3800;

function relativeTime(date) {
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:R>`;
}

function protectionStatus(team, now) {
  const statuses = [];
  const shieldExpiresAt = team.summerFight.shieldExpiresAt
    ? new Date(team.summerFight.shieldExpiresAt).getTime()
    : 0;
  const immunityExpiresAt = team.summerFight.immunityExpiresAt
    ? new Date(team.summerFight.immunityExpiresAt).getTime()
    : 0;

  if (shieldExpiresAt > now) {
    statuses.push('Shield active');
  }
  if (immunityExpiresAt > now) {
    statuses.push('Immunity active');
  }

  return statuses.join(' | ') || 'None';
}

function teamBlock(team, now) {
  ensureSummerFight(team);
  resetAttackWindow(team, now);
  resetShieldUses(team, new Date(now));

  const attacksRemaining = Math.max(
    0,
    ATTACKS_PER_WINDOW - team.summerFight.attacksUsed
  );
  const shieldsRemaining = Math.max(
    0,
    SHIELDS_PER_DAY - team.summerFight.shieldUses
  );
  const pending = hasPendingAttack(team) &&
    new Date(team.summerFight.pendingAttack.expiresAt).getTime() > now
    ? `\nUnder attack: block ${relativeTime(team.summerFight.pendingAttack.expiresAt)}`
    : '';

  return (
    `**${cleanTeamName(team.name) || 'Unnamed Team'}**\n` +
    `Attacks: ${attacksRemaining}/${ATTACKS_PER_WINDOW} | ` +
    `Shields: ${shieldsRemaining}/${SHIELDS_PER_DAY}\n` +
    `Protection: ${protectionStatus(team, now)}${pending}`
  );
}

function makePages(blocks) {
  const pages = [];
  let page = '';

  for (const block of blocks) {
    const next = page ? `${page}\n\n${block}` : block;
    if (next.length > MAX_DESCRIPTION_LENGTH && page) {
      pages.push(page);
      page = block;
    } else {
      page = next;
    }
  }

  if (page) pages.push(page);
  return pages;
}

module.exports = {
  name: 'teamstatus',
  aliases: ['teams', 'ts'],

  async execute(message) {
    const teams = await TeamDB.find({}).sort({ name: 1 });
    if (!teams.length) {
      return message.reply({
        embeds: [infoEmbed({ title: 'Team Status', description: 'No teams exist yet.' })]
      });
    }

    const now = Date.now();
    const pages = makePages(teams.map((team) => teamBlock(team, now)));

    for (let index = 0; index < pages.length; index += 1) {
      const payload = {
        embeds: [
          infoEmbed({
            title: pages.length > 1
              ? `Team Status (${index + 1}/${pages.length})`
              : 'Team Status',
            description: pages[index],
            footer: 'Summer Fight',
            timestamp: true
          })
        ],
        allowedMentions: { parse: [] }
      };

      if (index === 0) {
        await message.reply(payload);
      } else {
        await message.channel.send(payload);
      }
    }
  }
};
