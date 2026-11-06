const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
  OverwriteType, PermissionFlagsBits, RESTJSONErrorCodes
} = require('discord.js');
const config = require('../config');
const TournamentLock = require('../database/models/tournamentLock');
const logger = require('./logger');
const { createBracket, nextMatch, recordWinner, renderBracket } = require('./tournamentBracket');

const sessions = new Map();
const {
  AttachFiles, CreatePrivateThreads, CreatePublicThreads, ManageChannels, ManageRoles,
  ReadMessageHistory, SendMessages, SendMessagesInThreads, ViewChannel
} = PermissionFlagsBits;
const posting = SendMessages | SendMessagesInThreads | CreatePublicThreads | CreatePrivateThreads;
const noPings = { parse: [], repliedUser: false };
const hostRole = config.roles.staff.mod;
const cancelCommand = config.prefix + 'tournament cancel';

function mention(player) {
  return '<@' + player.id + '>';
}

function getOverwrites(channel) {
  return new Map(channel.permissionOverwrites.cache.map(({ id, type, allow, deny }) =>
    [id, { id, type, allow: allow.bitfield, deny: deny.bitfield }]
  ));
}

function getOverwrite(overwrites, id, type) {
  if (!overwrites.has(id)) overwrites.set(id, { id, type, allow: 0n, deny: 0n });
  return overwrites.get(id);
}

async function fetchChannel(client, id) {
  try {
    return await client.channels.fetch(id, { force: true });
  } catch (error) {
    if (error.code === RESTJSONErrorCodes.UnknownChannel) return null;
    throw error;
  }
}

async function setFightPermissions(channel, session, players = []) {
  const overwrites = getOverwrites(channel);
  for (const overwrite of overwrites.values()) overwrite.allow &= ~posting;

  getOverwrite(overwrites, channel.guild.id, OverwriteType.Role).deny |= posting;
  for (const id of [session.hostId, channel.client.user.id, ...players.map((player) => player.id)]) {
    const overwrite = getOverwrite(overwrites, id, OverwriteType.Member);
    overwrite.allow |= SendMessages;
    overwrite.deny &= ~SendMessages;
  }

  await channel.permissionOverwrites.set(
    [...overwrites.values()].filter(({ allow, deny }) => allow || deny),
    'FightHub tournament match permissions'
  );
}

async function restore(client, lock) {
  const channel = await fetchChannel(client, lock.id);
  if (channel) {
    const overwrites = getOverwrites(channel);
    for (const overwrite of overwrites.values()) {
      overwrite.allow &= ~posting;
      overwrite.deny &= ~posting;
    }
    for (const { id, type, allow, deny } of lock.overwrites) {
      const originalAllow = BigInt(allow) & posting;
      const originalDeny = BigInt(deny) & posting;
      if (!originalAllow && !originalDeny) continue;
      if (type === OverwriteType.Role && !channel.guild.roles.cache.has(id)) continue;
      const overwrite = getOverwrite(overwrites, id, type);
      overwrite.allow |= originalAllow;
      overwrite.deny |= originalDeny;
    }
    await channel.permissionOverwrites.set(
      [...overwrites.values()].filter(({ allow, deny }) => allow || deny),
      'Restore FightHub tournament channel permissions'
    );
  }
  await lock.deleteOne();
}

async function recover(client) {
  for (const lock of await TournamentLock.find()) {
    if (sessions.has(lock.id)) continue;
    sessions.set(lock.id, { phase: 'restoring' });
    try {
      await restore(client, lock);
    } catch (error) {
      logger.error('Could not restore tournament permissions in ' + lock.id, error);
    } finally {
      sessions.delete(lock.id);
    }
  }
}

async function sendBracket(channel, rounds, heading) {
  if (channel.permissionsFor(channel.guild.members.me).has(AttachFiles)) {
    try {
      await channel.send({
        content: heading,
        files: [{ attachment: renderBracket(rounds), name: 'tournament-bracket.png' }],
        allowedMentions: noPings
      });
      return;
    } catch (error) {
      logger.warn('Could not post tournament bracket image', error);
    }
  }

  const finished = Boolean(rounds.at(-1)[0].winner);
  const lines = [heading];
  for (const [round, matches] of (finished ? rounds : rounds.slice(0, 1)).entries()) {
    lines.push('**Round ' + (round + 1) + '**');
    for (const { players, winner } of matches) {
      const names = players.filter(Boolean).map((player) =>
        player === winner ? '**' + mention(player) + '**' : mention(player)
      );
      lines.push(names.length === 2 ? names.join(' vs ') : names[0] + ' (bye)');
    }
  }
  await channel.send({ content: lines.join('\n'), allowedMentions: noPings });
}

async function openFight(channel, session) {
  const { round, index, match } = session.current;
  await setFightPermissions(channel, session, match.players);
  const [first, second] = match.players;
  await channel.send({
    content: '**ROUND ' + (round + 1) + ' · MATCH ' + (index + 1) + '**\n\n' +
      mention(first) + ' vs ' + mention(second),
    allowedMentions: { users: [first.id, second.id] }
  });
  session.phase = 'fighting';
}

async function abort(channel, session, error) {
  logger.error('Tournament failed in ' + channel.id, error);
  let notice = 'Tournament stopped after an error. Channel permissions were restored.';
  try {
    await restore(channel.client, session.lock);
  } catch (restoreError) {
    logger.error('Tournament cleanup failed in ' + channel.id, restoreError);
    notice = 'Tournament stopped after an error. Use `' + cancelCommand +
      '` to retry channel permission restoration.';
  } finally {
    sessions.delete(channel.id);
  }
  await channel.send(notice).catch(() => {});
}

async function cancel(message) {
  const id = message.channel.id;
  const session = sessions.get(id);
  if (session && !['fighting', 'between'].includes(session.phase)) {
    return message.reply('The tournament is changing state. Try again in a moment.');
  }
  if (session && session.hostId !== message.author.id) {
    return message.reply('Only the host can cancel an active tournament.');
  }

  clearTimeout(session?.timer);
  sessions.set(id, { phase: 'restoring' });
  try {
    const lock = session?.lock ?? await TournamentLock.findById(id);
    if (!lock) return await message.reply('There is no tournament to cancel in this channel.');
    await restore(message.client, lock);
    await message.reply('Tournament canceled. Channel permissions restored.');
  } finally {
    sessions.delete(id);
  }
}

async function start(message) {
  const { guild, client, channel: originalChannel } = message;
  const id = originalChannel.id;
  if (sessions.has(id)) return message.reply('There is already a tournament or confirmation in this channel.');

  const session = { phase: 'pending', hostId: message.author.id };
  sessions.set(id, session);
  try {
    if (await TournamentLock.exists({ _id: id })) {
      return await message.reply('A previous tournament still needs cleanup. Use `' + cancelCommand + '` first.');
    }

    const reference = message.reference?.messageId ? await message.fetchReference().catch(() => null) : null;
    const ids = [...new Set(Array.from(
      (message.content + '\n' + (reference?.content ?? '')).matchAll(/<@!?(\d{17,20})>/g),
      (match) => match[1]
    ))];
    if (ids.length < 2 || ids.length > 32) {
      return await message.reply('Mention 2–32 distinct entrants in your command or in the message you reply to.');
    }

    const members = await guild.members.fetch({ user: ids, time: 10_000 });
    if (ids.some((userId) => !members.has(userId) || members.get(userId).user.bot)) {
      return await message.reply('Every entrant must be a human member of FightHub.');
    }

    const prompt = await message.reply({
      content: 'Start a single-elimination tournament with **' + ids.length +
        '** entrants? During the tournament, only the host and active fighters can chat.',
      allowedMentions: noPings,
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('tournament-start').setLabel('Start tournament').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('tournament-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )]
    });

    const click = await prompt.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (interaction) => interaction.user.id === session.hostId,
      time: 60_000
    }).catch(() => null);
    if (!click) return await prompt.edit({ content: 'Tournament confirmation expired.', components: [] });

    const confirmed = click.customId === 'tournament-start' && click.member.roles.cache.has(hostRole);
    await click.update({ content: confirmed ? 'Tournament confirmed.' : 'Tournament setup canceled.', components: [] });
    if (!confirmed) return;

    const channel = await fetchChannel(client, id);
    if (!channel) return;
    if (!channel.permissionsFor(guild.members.me).has(
      ViewChannel | ReadMessageHistory | ManageChannels | ManageRoles | posting
    )) {
      return await prompt.edit('Carbon needs to manage the channel and its permissions, read messages, and manage the posting permissions it will change.');
    }
    if (ids.some((userId) => !channel.permissionsFor(members.get(userId)).has(ViewChannel))) {
      return await prompt.edit('Every entrant needs access to view this channel.');
    }

    session.rounds = createBracket(ids.map((userId) => ({ id: userId, name: members.get(userId).displayName })));
    session.current = nextMatch(session.rounds);
    session.lock = await TournamentLock.create({
      _id: id,
      overwrites: [...getOverwrites(channel).values()].map(({ id, type, allow, deny }) =>
        ({ id, type, allow: allow.toString(), deny: deny.toString() })
      )
    });

    await setFightPermissions(channel, session);
    await sendBracket(channel, session.rounds, '**Tournament bracket**');
    await openFight(await fetchChannel(client, id), session);
  } catch (error) {
    if (!session.lock) throw error;
    await abort(originalChannel, session, error);
  } finally {
    if (sessions.get(id) === session && session.phase !== 'fighting') sessions.delete(id);
  }
}

async function reportWinner(message) {
  const session = sessions.get(message.channel.id);
  if (session?.phase !== 'fighting' || session.hostId !== message.author.id ||
      !message.member?.roles.cache.has(hostRole)) return;

  const result = /^win\s+<@!?(\d{17,20})>$/i.exec(message.content.trim());
  if (!result) return;

  const { round, index, match } = session.current;
  const winner = match.players.find(({ id }) => id === result[1]);
  if (!winner) return message.reply({ content: 'Pick one of the two fighters in the current match.', allowedMentions: noPings });

  session.phase = 'scoring';
  const channel = message.channel;
  try {
    await setFightPermissions(await fetchChannel(message.client, channel.id), session);
    recordWinner(session.rounds, round, index, winner);
    session.current = nextMatch(session.rounds);
    if (!session.current) {
      await restore(message.client, session.lock);
      sessions.delete(channel.id);
      await sendBracket(channel, session.rounds, '🏆 ' + mention(winner) + ' wins the tournament!');
      return;
    }

    await channel.send({ content: mention(winner) + ' wins and advances.', allowedMentions: noPings });
    session.phase = 'between';
    session.timer = setTimeout(async () => {
      session.phase = 'opening';
      try {
        await openFight(await fetchChannel(message.client, channel.id), session);
      } catch (error) {
        await abort(channel, session, error);
      }
    }, 3_000);
  } catch (error) {
    if (sessions.get(channel.id) !== session) throw error;
    await abort(channel, session, error);
  }
}

module.exports = { cancel, recover, reportWinner, start };
