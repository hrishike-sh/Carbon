const { Collection, ChannelType } = require('discord.js');
const config = require('../../config');
const logger = require('../../utils/logger');
const { warningEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const path = require('path');
const os = require('os');
const fs = require('fs');

const Game = new Collection();
const Messages = new Collection();

module.exports = {
  name: 'mafia',

  async execute(message, client) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText) return;
    if (message.guild.id !== config.ids.guildId) return;
    if (message.channel.name !== 'mafia') return;

    const mafiaBotIds = config.ids.mafiaBotIds;
    const logChannelId = config.ids.channels.mafiaLog;
    const logChannel = client.channels.cache.get(logChannelId);

    if (!Game.has(message.channel.id) && mafiaBotIds.includes(message.author.id)) {
      const nightInfo = getNightInfo(message);
      if (nightInfo?.night === 1) {
        await startNewGameFromNight(message, nightInfo, logChannel);
      }
    }

    if (!Game.has(message.channel.id) && message.mentions.users.size > 0) {
      await startNewGame(message, logChannel);
    }

    if (Game.has(message.channel.id)) {
      await handleExistingGame(message, client, { mafiaBotIds, logChannelId, logChannel });
    }
  }
};

function componentToJSON(component) {
  if (!component) return component;
  if (typeof component.toJSON === 'function') {
    try {
      return component.toJSON();
    } catch (err) {
      return component;
    }
  }
  return component;
}

function collectComponentText(node, output = []) {
  if (!node) return output;

  if (Array.isArray(node)) {
    for (const item of node) collectComponentText(item, output);
    return output;
  }

  if (typeof node !== 'object') return output;

  const component = componentToJSON(node);
  if (component !== node) return collectComponentText(component, output);

  if (typeof component.content === 'string') output.push(component.content);
  collectComponentText(component.components, output);
  collectComponentText(component.items, output);
  return output;
}

function getMessageText(message) {
  const componentText = collectComponentText(message.components).join('\n');
  const embedText = (message.embeds || [])
    .map((embed) => [
      embed.title,
      embed.description,
      ...(embed.fields || []).flatMap((field) => [field.name, field.value]),
      embed.footer?.text
    ].filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n');

  return [message.content, componentText, embedText].filter(Boolean).join('\n');
}

function extractUserIds(text) {
  return [...String(text || '').matchAll(/<@!?(\d{17,20})>/g)].map((match) => match[1]);
}

function getSection(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start === -1) return '';

  const afterStart = text.slice(start);
  const end = afterStart.search(endPattern);
  return end === -1 ? afterStart : afterStart.slice(0, end);
}

function getNightInfo(message) {
  const text = getMessageText(message);
  const night = Number(text.match(/###\s*Night\s+(\d+)/i)?.[1] || 0);
  if (!night) return null;

  const aliveSection = getSection(
    text,
    /\*\*Currently Alive:\*\*|Currently Alive:/i,
    /\*\*Currently Dead:\*\*|Currently Dead:|## Currently Dead/i
  );
  const deadSection = getSection(
    text,
    /\*\*Currently Dead:\*\*|Currently Dead:|## Currently Dead/i,
    /###\s*(Day|Night|Now|Nomination)|\*\*Currently Alive:\*\*/i
  );

  return {
    night,
    aliveIds: extractUserIds(aliveSection),
    deadIds: extractUserIds(deadSection),
    text
  };
}

function isGameOverMessage(message) {
  const embed = message.embeds?.[0];
  if (embed?.footer?.text?.includes('Enjoyed') || embed?.title?.includes('Game Over')) {
    return true;
  }

  return /game\s+over|thanks for playing|enjoyed/i.test(getMessageText(message));
}

async function handleExistingGame(message, client, { mafiaBotIds, logChannelId, logChannel }) {
  const currentGame = Game.get(message.channel.id);

  if (Messages.has(message.channel.id)) {
    Messages.get(message.channel.id).push(message);
  } else {
    Messages.set(message.channel.id, [message]);
  }

  if (mafiaBotIds.includes(message.author.id)) {
    const embed = message.embeds?.[0];

    if (getNightInfo(message) || embed?.title?.includes('Night')) {
      await handleNightMessage(message, embed, currentGame, logChannel);
    } else if (isGameOverMessage(message)) {
      await handleGameOver(message, client, currentGame, logChannelId, logChannel);
    }
  } else {
    const player = currentGame.players.get(message.author.id);
    if (!player) return;

    const prev = player.messages.get(currentGame.night) || 0;
    player.messages.set(currentGame.night, prev + 1);
  }
}

function updateRoster(currentGame, aliveIds, deadIds, currentNight) {
  const alive = [];
  const newlyDead = [];
  const aliveSet = new Set(aliveIds);

  for (const userId of aliveIds) {
    const player = currentGame.players.get(userId);
    if (!player) continue;
    player.alive = true;
    alive.push(userId);
  }

  for (const userId of deadIds) {
    const player = currentGame.players.get(userId);
    if (!player) continue;
    if (player.alive || aliveSet.has(userId)) {
      player.alive = false;
      player.deadAt = Math.max(0, currentNight - 1);
      newlyDead.push(userId);
    } else {
      player.alive = false;
      if (!player.deadAt) player.deadAt = Math.max(0, currentNight - 1);
    }
  }

  return { alive, dead: newlyDead };
}

function parseEmbedRoster(embed, currentGame, currentNight) {
  const alive = [];
  const dead = [];

  for (const field of embed.fields ?? []) {
    const userIds = extractUserIds(field.value);

    for (const userId of userIds) {
      const player = currentGame.players.get(userId);
      if (!player) continue;

      if (field.name.includes('Alive')) {
        player.alive = true;
        alive.push(userId);
      } else if (field.name.includes('Dead')) {
        if (!player.alive) continue;
        player.alive = false;
        player.deadAt = currentNight - 1;
        dead.push(userId);
      }
    }
  }

  return { alive, dead };
}

async function handleNightMessage(message, embed, currentGame, logChannel) {
  const nightInfo = getNightInfo(message);
  const currentNight = nightInfo?.night || Number(embed?.title?.match(/\d+/)?.[0] || 1);
  currentGame.night = currentNight;

  const roster = nightInfo
    ? updateRoster(currentGame, nightInfo.aliveIds, nightInfo.deadIds, currentNight)
    : parseEmbedRoster(embed, currentGame, currentNight);

  const { alive, dead } = roster;

  try {
    const aliveDeadEmbed = warningEmbed({
      title: `Night ${Math.max(1, currentNight - 1)}`,
      fields: [
        { name: 'Alive', value: alive.map((id) => `<@${id}>`).join('\n') || 'None', inline: true },
        { name: 'Dead', value: dead.map((id) => `<@${id}>`).join('\n') || 'None', inline: true }
      ]
    });

    const messageEmbed = warningEmbed({
      title: `Night ${currentNight - 1} messages`,
      description:
        currentGame.players
          .filter((p) => p.alive)
          .map((p) => {
            const msgs = p.messages.get(currentNight - 1) || 0;
            return `<:dot:${config.ids.emojis.dot}> <@${p.id}> => ${msgs}/3 ${
              msgs >= 3
                ? `<:TickYes:${config.ids.emojis.tickYes}>`
                : `<:TickNo:${config.ids.emojis.tickNo}>`
            }`;
          })
          .join('\n') || 'No messages yet.'
    });

    const ch = message.client.channels.cache.get(config.ids.channels.mafiaLog);
    if (ch?.isTextBased()) {
      await ch.send({
        embeds: currentNight === 1 ? [aliveDeadEmbed] : [aliveDeadEmbed, messageEmbed]
      });
    }
  } catch (error) {
    logger.error('Error handling mafia night embed', error);
  }
}

async function handleGameOver(message, client, currentGame, logChannelId, logChannel) {
  const channel = message.channel;
  currentGame.night++;

  const currentNight = currentGame.night;

  const messageEmbed = warningEmbed({
    title: `Night ${currentNight - 1} messages`,
    description:
      currentGame.players
        .filter((p) => p.alive)
        .map((p) => {
          const msgs = p.messages.get(currentNight - 1) || 0;
          return `<:dot:${config.ids.emojis.dot}> <@${p.id}> => ${msgs}/3 ${
            msgs >= 3
              ? `<:TickYes:${config.ids.emojis.tickYes}>`
              : `<:TickNo:${config.ids.emojis.tickNo}>`
          }`;
        })
        .join('\n') || 'No messages yet.'
  });

  const logCh = message.client.channels.cache.get(config.ids.channels.mafiaLog);
  if (logCh?.isTextBased()) {
    await logCh.send({
      embeds: [
        messageEmbed,
        warningEmbed({
          title: 'Final Summary',
          description:
            currentGame.players
              .map((p) => {
                const status = p.alive
                  ? `<:Alive:${config.ids.emojis.alive}>`
                  : `<:Dead:${config.ids.emojis.dead}>`;
                const totalMsgs = [...p.messages.values()].reduce((t, v) => t + v, 0);
                return `${status} <@${p.id}> ${p.alive ? '' : `Died N${p.deadAt}`}\n<:dot:${config.ids.emojis.dot}>Total messages: ${totalMsgs}`;
              })
              .join('\n')
        })
      ]
    });

    await logCh.send({
      embeds: [errorEmbed({ title: 'Game over' })]
    });
  }

  Game.delete(message.channel.id);

  try {
    const discordTranscripts = require('discord-html-transcripts');
    const channelMessages = Messages.get(message.channel.id);
    if (channelMessages) {
      const transcriptBuffer = await discordTranscripts.generateFromMessages(
        channelMessages,
        channel,
        { returnType: 'buffer' }
      );
      const name = `mafia-${channel.id}-${Date.now()}`;
      const transcriptDir = path.join(os.homedir(), 'transcripts', 'public');
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }
      const transcriptPath = path.join(transcriptDir, `${name}.html`);
      fs.writeFileSync(transcriptPath, transcriptBuffer);
      const lc = message.client.channels.cache.get(config.ids.channels.mafiaLog);
      if (lc) {
        await lc.send(`Transcript: https://hrish.dev/transcripts/${name}`);
      }
    }
    Messages.delete(message.channel.id);
  } catch (err) {
    logger.error('Error generating mafia transcript', err);
  }
}

async function startNewGame(message, logChannel) {
  const players = new Collection();
  for (const [, user] of message.mentions.users) {
    console.log(`Adding ${user.tag} to the game`);
    players.set(user.id, { id: user.id, alive: true, messages: new Collection() });
  }

  Game.set(message.channel.id, { night: 1, players });

  const lc = message.client.channels.cache.get(config.ids.channels.mafiaLog);
  if (lc?.isTextBased()) {
    await lc.send({
      embeds: [
        successEmbed({
          title: 'New game',
          description: message.mentions.users.map((u) => `<@${u.id}>`).join('\n')
        })
      ]
    });
  }
}

async function startNewGameFromNight(message, nightInfo, logChannel) {
  const players = new Collection();
  const playerIds = [...new Set([...nightInfo.aliveIds, ...nightInfo.deadIds])];

  for (const userId of playerIds) {
    players.set(userId, {
      id: userId,
      alive: nightInfo.aliveIds.includes(userId),
      deadAt: nightInfo.deadIds.includes(userId) ? 0 : undefined,
      messages: new Collection()
    });
  }

  Game.set(message.channel.id, { night: nightInfo.night, players });
  Messages.set(message.channel.id, []);

  const lc = logChannel || message.client.channels.cache.get(config.ids.channels.mafiaLog);
  if (lc?.isTextBased()) {
    await lc.send({
      embeds: [
        successEmbed({
          title: 'New game',
          description: playerIds.map((id) => `<@${id}>`).join('\n') || 'No players found.'
        })
      ]
    });
  }
}
