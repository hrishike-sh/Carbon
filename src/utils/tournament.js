const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
  OverwriteType, PermissionFlagsBits, RESTJSONErrorCodes
} = require('discord.js');
const config = require('../config');
const TournamentLock = require('../database/models/tournamentLock');
const logger = require('./logger');
const { createEmbed } = require('./embeds');
const { createBracket, nextMatch, recordWinner, loadBracketAvatars, renderBracket } = require('./tournamentBracket');

const sessions = new Map();
const {
  AttachFiles, CreatePrivateThreads, CreatePublicThreads, EmbedLinks, ManageChannels, ManageRoles,
  ReadMessageHistory, SendMessages, SendMessagesInThreads, ViewChannel
} = PermissionFlagsBits;
const posting = SendMessages | SendMessagesInThreads | CreatePublicThreads | CreatePrivateThreads;
const noPings = { parse: [], repliedUser: false };
const hostRole = config.roles.staff.mod;
const cancelCommand = config.prefix + 'tournament cancel';

function tournamentNotice(title, description, color = 'info') {
  return {
    embeds: [createEmbed({ title, description, color, footer: 'FightHub tournaments' })],
    allowedMentions: noPings
  };
}

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

async function sendBracket(channel, rounds, matchWinner) {
  const champion = rounds.at(-1)[0].winner;
  const title = champion ? '🏆 Tournament champion' : matchWinner ? 'Match result' : 'Tournament bracket';
  const description = champion
    ? mention(champion) + ' wins the FightHub tournament!'
    : matchWinner
      ? mention(matchWinner) + ' wins and advances. The highlighted matchup is up next.'
      : 'Randomized single elimination. The highlighted matchup is up first.';
  const color = champion ? 0xf6cc78 : matchWinner ? 'success' : 'info';
  const payload = tournamentNotice(title, description, color);

  const canAttach = channel.permissionsFor(channel.guild.members.me).has(AttachFiles);
  if (canAttach) {
    try {
      await channel.send({
        ...payload,
        embeds: [payload.embeds[0].setImage('attachment://tournament-bracket.png')],
        files: [{
          attachment: renderBracket(rounds),
          name: 'tournament-bracket.png',
          description: champion ? 'Completed FightHub tournament bracket' : 'FightHub tournament matchups'
        }]
      });
      return;
    } catch (error) {
      logger.warn('Could not post tournament bracket image in ' + channel.id, error);
    }
  }

  const next = nextMatch(rounds);
  const lines = [
    champion ? description : matchWinner ? mention(matchWinner) + ' wins and advances.' : 'Randomized single elimination.',
    ''
  ];
  for (const [round, matches] of rounds.entries()) {
    lines.push('**Round ' + (round + 1) + '**');
    for (const match of matches) {
      const names = match.players.map((player) => {
        if (!player) return round === 0 ? 'Bye' : 'Awaiting winner';
        return player === match.winner ? '✓ ' + mention(player) : mention(player);
      });
      lines.push(names.join(' vs ') + (match === next?.match ? ' · **Up next**' : ''));
    }
  }
  const fallback = tournamentNotice(title, lines.join('\n'), color);
  fallback.embeds[0].setFooter({
    text: canAttach ? 'FightHub • Bracket image unavailable' : 'FightHub • Carbon needs Attach Files to show the bracket image'
  });
  await channel.send(fallback);
}

async function openFight(channel, session) {
  const { round, index, match } = session.current;
  await setFightPermissions(channel, session, match.players);
  const [first, second] = match.players;
  session.announcement = channel.send({
    ...tournamentNotice(
      'Round ' + (round + 1) + (round === session.rounds.length - 1 ? ' · Championship' : ' · Match ' + (index + 1)),
      'Fight is live. The host reports the result with `win @user`.'
    ),
    content: mention(first) + ' **vs** ' + mention(second),
    allowedMentions: { users: [first.id, second.id] }
  });
  try {
    await session.announcement;
    session.phase = 'fighting';
  } finally {
    delete session.announcement;
  }
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
  await channel.send(tournamentNotice('Tournament stopped', notice, 'error')).catch(() => {});
}

async function cancel(message) {
  const id = message.channel.id;
  const session = sessions.get(id);
  if (session && !['fighting', 'between'].includes(session.phase)) {
    return message.reply(tournamentNotice('Tournament busy', 'Try again in a moment.', 'warning'));
  }
  if (session && session.hostId !== message.author.id) {
    return message.reply(tournamentNotice('Host only', 'Only the host can cancel an active tournament.', 'warning'));
  }

  clearTimeout(session?.timer);
  sessions.set(id, { phase: 'restoring' });
  try {
    const lock = session?.lock ?? await TournamentLock.findById(id);
    if (!lock) return await message.reply(tournamentNotice('No active tournament', 'There is no tournament to cancel in this channel.', 'warning'));
    await restore(message.client, lock);
    await message.reply(tournamentNotice('Tournament canceled', 'Channel permissions restored.'));
  } finally {
    sessions.delete(id);
  }
}

async function start(message) {
  const { guild, client, channel: originalChannel } = message;
  const id = originalChannel.id;
  if (!originalChannel.permissionsFor(guild.members.me).has(EmbedLinks)) {
    return message.reply('Carbon needs the Embed Links permission to host tournaments here.');
  }
  if (sessions.has(id)) return message.reply(tournamentNotice('Tournament already in progress', 'This channel already has a tournament or a pending confirmation.', 'warning'));

  const session = { phase: 'pending', hostId: message.author.id };
  sessions.set(id, session);
  try {
    if (await TournamentLock.exists({ _id: id })) {
      return await message.reply(tournamentNotice('Channel recovery needed', 'Use `' + cancelCommand + '` to restore channel permissions first.', 'warning'));
    }

    const reference = message.reference?.messageId ? await message.fetchReference().catch(() => null) : null;
    const ids = [...new Set(Array.from(
      (message.content + '\n' + (reference?.content ?? '')).matchAll(/<@!?(\d{17,20})>/g),
      (match) => match[1]
    ))];
    if (ids.length < 2 || ids.length > 32) {
      return await message.reply(tournamentNotice('Check the roster', 'Mention 2–32 distinct entrants in your command or in the message you reply to.', 'warning'));
    }

    const members = await guild.members.fetch({ user: ids, time: 10_000 });
    if (ids.some((userId) => !members.has(userId) || members.get(userId).user.bot)) {
      return await message.reply(tournamentNotice('Check the roster', 'Every entrant must be a human member of FightHub.', 'warning'));
    }

    const prompt = await message.reply({
      ...tournamentNotice(
        'Host a FightHub tournament',
        '**' + ids.length + ' entrants** · Single elimination\n\n' +
          'Confirm within one minute. During the tournament, chat is reserved for the host and active fighters.'
      ),
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
    if (!click) return await prompt.edit({
      ...tournamentNotice('Confirmation expired', 'Run the tournament command again when you are ready.', 'warning'),
      components: []
    });

    const confirmed = click.customId === 'tournament-start' && click.member.roles.cache.has(hostRole);
    await click.update({
      ...tournamentNotice(
        confirmed ? 'Tournament confirmed' : 'Setup canceled',
        confirmed ? 'Preparing the bracket and opening matchup.' : 'The channel is ready for another setup.',
        confirmed ? 'success' : 'neutral'
      ),
      components: []
    });
    if (!confirmed) return;

    const channel = await fetchChannel(client, id);
    if (!channel) return;
    if (!channel.permissionsFor(guild.members.me).has(
      ViewChannel | ReadMessageHistory | ManageChannels | ManageRoles | posting
    )) {
      return await prompt.edit(tournamentNotice('Missing channel permissions',
        'Carbon needs access to read messages, manage the channel and its permissions, and change posting permissions.', 'error'));
    }
    if (ids.some((userId) => !channel.permissionsFor(members.get(userId)).has(ViewChannel))) {
      return await prompt.edit(tournamentNotice('Entrant access required', 'Every entrant needs access to view this channel.', 'warning'));
    }

    const entrants = ids.map((userId) => {
      const member = members.get(userId);
      return {
        id: userId,
        name: member.displayName,
        avatarUrl: member.displayAvatarURL({ extension: 'png', forceStatic: true, size: 64 })
      };
    });
    if (channel.permissionsFor(guild.members.me).has(AttachFiles)) {
      await loadBracketAvatars(entrants).catch((error) => logger.warn('Could not load tournament avatars', error));
    }
    session.rounds = createBracket(entrants);
    session.current = nextMatch(session.rounds);
    session.lock = await TournamentLock.create({
      _id: id,
      overwrites: [...getOverwrites(channel).values()].map(({ id, type, allow, deny }) =>
        ({ id, type, allow: allow.toString(), deny: deny.toString() })
      )
    });

    await setFightPermissions(channel, session);
    await sendBracket(channel, session.rounds);
    await openFight(await fetchChannel(client, id), session);
  } catch (error) {
    if (!session.lock) throw error;
    await abort(originalChannel, session, error);
  } finally {
    if (sessions.get(id) === session && session.phase === 'pending') sessions.delete(id);
  }
}

async function reportWinner(message) {
  const session = sessions.get(message.channel.id);
  if (!session || session.hostId !== message.author.id ||
      !message.member?.roles.cache.has(hostRole)) return;

  const result = /^win\s+<@!?(\d{17,20})>$/i.exec(message.content.trim());
  if (!result) return;

  const current = session.current;
  if (session.announcement) await session.announcement.catch(() => {});
  if (session.phase !== 'fighting' || session.current !== current) return;

  const { round, index, match } = current;
  const winner = match.players.find(({ id }) => id === result[1]);
  if (!winner) return message.reply(tournamentNotice('Invalid winner', 'Pick one of the two fighters in the current match.', 'warning'));

  session.phase = 'scoring';
  let channel = message.channel;
  try {
    channel = await fetchChannel(message.client, channel.id) ?? channel;
    if (round < session.rounds.length - 1) await setFightPermissions(channel, session);
    recordWinner(session.rounds, round, index, winner);
    session.current = nextMatch(session.rounds);
    if (!session.current) {
      let restored = false;
      try {
        await restore(message.client, session.lock);
        restored = true;
      } catch (error) {
        logger.error('Could not restore tournament permissions in ' + channel.id, error);
      }
      try {
        await sendBracket(channel, session.rounds);
        if (!restored) {
          await channel.send(tournamentNotice('Channel recovery needed',
            'Use `' + cancelCommand + '` to retry restoring channel permissions.', 'warning'));
        }
      } finally {
        sessions.delete(channel.id);
      }
      return;
    }

    await sendBracket(channel, session.rounds, winner);
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
