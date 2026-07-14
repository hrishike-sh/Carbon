const TeamDB = require('../database/models/teams');
const { successEmbed } = require('./embeds');

const MIN_TEAM_MEMBERS = 3;
const ATTACKS_PER_WINDOW = 4;
const ATTACK_WINDOW_MS = 6 * 60 * 60 * 1000;
const BLOCK_WINDOW_MS = 60 * 1000;
const SHIELD_DURATION_MS = 30 * 60 * 1000;
const IMMUNITY_DURATION_MS = 6 * 60 * 60 * 1000;
const SHIELDS_PER_DAY = 2;

const SCORE = {
  ATTACK_SUCCESS: 10,
  FAILED_ATTACK: -5,
  MANUAL_BLOCK: 5,
  SHIELD_BLOCK: 3
};

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextDayTimestamp(date = new Date()) {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return Math.floor(next.getTime() / 1000);
}

function formatSeconds(ms) {
  return Math.max(1, Math.ceil(ms / 1000));
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanTeamName(name) {
  return String(name || '')
    .replace(/<@!?\d+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[*_~`\s]+|[*_~`\s]+$/g, '')
    .trim();
}

function displayTeamName(teamOrName, fallback = 'Unknown team') {
  const name = typeof teamOrName === 'object' && teamOrName !== null
    ? teamOrName.name
    : teamOrName;
  return cleanTeamName(name) || fallback;
}

async function cleanupTeamNames() {
  const teams = await TeamDB.find({ name: /<@!?\d+>/ });
  let updated = 0;

  for (const team of teams) {
    const cleanedName = cleanTeamName(team.name);
    if (!cleanedName || cleanedName === team.name) continue;

    team.name = cleanedName;
    await team.save();
    updated += 1;
  }

  return updated;
}

function ensureSummerFight(team) {
  if (!team.summerFight) team.summerFight = {};
  if (!team.summerFight.stats) team.summerFight.stats = {};
  if (!team.summerFight.pendingAttack) team.summerFight.pendingAttack = {};
  if (typeof team.lives !== 'number') team.lives = 5;
  if (typeof team.points !== 'number') team.points = 0;
  if (typeof team.summerFight.attacksUsed !== 'number') {
    team.summerFight.attacksUsed = 0;
  }
  if (typeof team.summerFight.shieldUses !== 'number') {
    team.summerFight.shieldUses = 0;
  }
  return team;
}

async function findTeamByUser(userId) {
  const team = await TeamDB.findOne({ users: userId });
  return team ? ensureSummerFight(team) : null;
}

async function findTeamByName(name) {
  const teamName = name.trim();
  if (!teamName) return null;

  const team = await TeamDB.findOne({
    name: { $regex: `^${escapeRegex(teamName)}$`, $options: 'i' }
  });
  return team ? ensureSummerFight(team) : null;
}

function isShieldActive(team, now = Date.now()) {
  ensureSummerFight(team);
  const expiresAt = team.summerFight.shieldExpiresAt;
  return expiresAt && new Date(expiresAt).getTime() > now;
}

function isImmunityActive(team, now = Date.now()) {
  ensureSummerFight(team);
  const expiresAt = team.summerFight.immunityExpiresAt;
  return Boolean(expiresAt && new Date(expiresAt).getTime() > now);
}

function resetAttackWindow(team, now = Date.now()) {
  ensureSummerFight(team);
  const startedAt = team.summerFight.attackWindowStartedAt
    ? new Date(team.summerFight.attackWindowStartedAt).getTime()
    : 0;

  if (!startedAt || now - startedAt >= ATTACK_WINDOW_MS) {
    team.summerFight.attackWindowStartedAt = new Date(now);
    team.summerFight.attacksUsed = 0;
  }
}

function resetShieldUses(team, now = new Date()) {
  ensureSummerFight(team);
  const today = dayKey(now);

  if (team.summerFight.shieldDay !== today) {
    team.summerFight.shieldDay = today;
    team.summerFight.shieldUses = 0;
  }
}

function hasPendingAttack(team) {
  ensureSummerFight(team);
  return Boolean(
    team.summerFight.pendingAttack &&
      team.summerFight.pendingAttack.attackerTeamId &&
      team.summerFight.pendingAttack.expiresAt
  );
}

function clearPendingAttack(team) {
  team.summerFight.pendingAttack = {
    attackerTeamId: null,
    attackerTeamName: '',
    createdAt: null,
    expiresAt: null,
    channelId: ''
  };
}

async function resolveExpiredAttack(targetTeam, channel) {
  ensureSummerFight(targetTeam);
  if (!hasPendingAttack(targetTeam)) return false;

  const pending = targetTeam.summerFight.pendingAttack;
  if (new Date(pending.expiresAt).getTime() > Date.now()) return false;

  const attacker = await TeamDB.findById(pending.attackerTeamId);
  const attackerName = displayTeamName(
    pending.attackerTeamName,
    displayTeamName(attacker)
  );
  const targetName = displayTeamName(targetTeam);
  if (attacker) {
    ensureSummerFight(attacker);
    attacker.points += SCORE.ATTACK_SUCCESS;
    attacker.summerFight.stats.attacksSucceeded =
      (attacker.summerFight.stats.attacksSucceeded || 0) + 1;
    await attacker.save();
  }

  targetTeam.lives = Math.max(0, (targetTeam.lives || 0) - 1);
  clearPendingAttack(targetTeam);
  await targetTeam.save();

  if (channel) {
    await channel.send({
      embeds: [
        successEmbed({
          title: 'Attack successful!',
          description: `**${attackerName}** broke through **${targetName}**'s defenses.`,
          fields: [
            { name: 'Attacker', value: attackerName, inline: true },
            { name: 'Defender', value: targetName, inline: true },
            { name: 'Damage dealt', value: '1 life', inline: true },
            { name: 'Points earned', value: `+${SCORE.ATTACK_SUCCESS}`, inline: true }
          ],
          footer: 'Summer Fight',
          timestamp: true
        })
      ]
    }).catch(() => {});
  }

  return true;
}

async function blockPendingAttack(targetTeam, type) {
  ensureSummerFight(targetTeam);
  if (!hasPendingAttack(targetTeam)) return null;

  const pending = targetTeam.summerFight.pendingAttack;
  const attacker = await TeamDB.findById(pending.attackerTeamId);
  const attackerName = displayTeamName(
    pending.attackerTeamName,
    displayTeamName(attacker)
  );
  const blockScore = type === 'shield' ? SCORE.SHIELD_BLOCK : SCORE.MANUAL_BLOCK;

  if (attacker) {
    ensureSummerFight(attacker);
    attacker.points += SCORE.FAILED_ATTACK;
    attacker.summerFight.stats.attacksFailed =
      (attacker.summerFight.stats.attacksFailed || 0) + 1;
    await attacker.save();
  }

  targetTeam.points += blockScore;
  if (type === 'shield') {
    targetTeam.summerFight.stats.shieldBlocks =
      (targetTeam.summerFight.stats.shieldBlocks || 0) + 1;
  } else {
    targetTeam.summerFight.stats.manualBlocks =
      (targetTeam.summerFight.stats.manualBlocks || 0) + 1;
  }
  clearPendingAttack(targetTeam);
  await targetTeam.save();

  return {
    attacker,
    attackerName,
    blockScore
  };
}

function scheduleAttackResolution(client, targetTeamId, channelId) {
  setTimeout(async () => {
    const targetTeam = await TeamDB.findById(targetTeamId).catch(() => null);
    if (!targetTeam) return;

    const channel = client.channels.cache.get(channelId);
    await resolveExpiredAttack(targetTeam, channel);
  }, BLOCK_WINDOW_MS + 1000);
}

module.exports = {
  MIN_TEAM_MEMBERS,
  ATTACKS_PER_WINDOW,
  ATTACK_WINDOW_MS,
  BLOCK_WINDOW_MS,
  SHIELD_DURATION_MS,
  IMMUNITY_DURATION_MS,
  SHIELDS_PER_DAY,
  SCORE,
  dayKey,
  nextDayTimestamp,
  formatSeconds,
  cleanTeamName,
  displayTeamName,
  cleanupTeamNames,
  ensureSummerFight,
  findTeamByUser,
  findTeamByName,
  isShieldActive,
  isImmunityActive,
  resetAttackWindow,
  resetShieldUses,
  hasPendingAttack,
  clearPendingAttack,
  resolveExpiredAttack,
  blockPendingAttack,
  scheduleAttackResolution
};
