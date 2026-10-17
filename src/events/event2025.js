const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} = require('discord.js');
const config = require('../config');
const { sleep, shuffle } = require('../utils/helpers');
const { Theme } = require('../utils/embeds');
const Team = require('../database/models/teams');
const { onAsync, startInterval } = require('../utils/asyncEvents');

const awardPoint = async (userId) => {
  try {
    return await Team.findOneAndUpdate(
      { users: userId }, { $inc: { points: 1 } }, { new: true }
    );
  } catch (error) {
    console.error('Error awarding point:', error);
    return null;
  }
};

const sendWinnerEmbed = async (channel, winner, eventName, team, showTeam = true) => {
  const embed = new EmbedBuilder()
    .setTitle('🎉 Event Winner! 🎉')
    .setDescription(`${winner} won the **${eventName}** event!`)
    .setColor(Theme.warning)
    .setThumbnail(winner.displayAvatarURL())
    .setTimestamp();
  if (showTeam) {
    embed.addFields(
      { name: 'Team', value: team ? `**${team.name}**` : 'No Team', inline: true },
      { name: 'Team Points', value: team ? `**${team.points}**` : 'N/A', inline: true }
    );
  }

  await channel.send({ embeds: [embed] });

  if (team && Math.random() < 0.05) {
    team.lastLb = new Date(Date.now() - 12 * 60 * 60 * 1000);
    await team.save();
    await channel.send(`🎉 ${winner} got lucky! Their lootbox cooldown has been reset!`);
  }
};

const EVENTS = [
  'find_the_ball', 'emoji_memory', 'basketball', 'crab_race',
  'higher_or_lower', 'unscramble', 'rock_paper_scissors', 'guess_the_number'
];

const EVENT_NAMES = {
  find_the_ball: 'Find the Ball',
  emoji_memory: 'Emoji Memory',
  basketball: 'Basketball',
  crab_race: 'Crab Race',
  higher_or_lower: 'Higher or Lower',
  unscramble: 'Unscramble',
  rock_paper_scissors: 'Rock, Paper, Scissors',
  guess_the_number: 'Guess the Number'
};

async function runEvent(client, channel, index, { awardTeamPoints = false } = {}) {
  const eventIndex = index === undefined ? Math.floor(Math.random() * EVENTS.length) : index;
  if (!Number.isInteger(eventIndex) || eventIndex < 0 || eventIndex >= EVENTS.length) {
    throw new RangeError('Event index must be an integer from 0 to 7');
  }
  const eventKey = EVENTS[eventIndex];
  const eventName = EVENT_NAMES[eventKey];
  const award = awardTeamPoints ? awardPoint : async () => null;
  const announce = awardTeamPoints ? sendWinnerEmbed :
    (target, winner, name) => sendWinnerEmbed(target, winner, name, null, false);

  if (eventKey === 'crab_race') return runCrabRace(client, channel, eventName, award, announce);
  const runners = {
    find_the_ball: runFindTheBall,
    emoji_memory: runEmojiMemory,
    basketball: runBasketball,
    higher_or_lower: runHigherOrLower,
    unscramble: runUnscramble,
    rock_paper_scissors: runRPS,
    guess_the_number: runGuessTheNumber
  };
  return runners[eventKey](channel, null, new Set(), eventName, award, announce);
}

module.exports = {
  name: 'tick',
  disabled: true, // Stop automatic seasonal games and team rewards.
  runEvent,

  async execute(client) {
    const channel = client.channels.cache.get(config.ids.channels.event2025);
    if (!channel) return;

    startInterval(client, async () => {
      try {
        await channel.send({
          content: `<@&${config.roles.pingRoles.event2025}> an event is spawning!`,
          allowedMentions: { roles: [config.roles.pingRoles.event2025] }
        });
        await sleep(3000);

        await runEvent(client, channel, undefined, { awardTeamPoints: true });
      } catch (err) {
        console.error('Event error:', err);
      }
    }, 1000 * 60 * 10, 'Seasonal event');
  }
};

async function runFindTheBall(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const ballEmbed = new EmbedBuilder()
    .setTitle('Guess where the ball is!')
    .setColor(Theme.warning)
    .setFooter({ text: 'You get one try! Click the button to guess!' });

  const row = new ActionRowBuilder().addComponents(
    [
      new ButtonBuilder().setCustomId('ball').setEmoji(config.ids.emojis.blank).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('not_ball_1').setEmoji(config.ids.emojis.blank).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('not_ball_2').setEmoji(config.ids.emojis.blank).setStyle(ButtonStyle.Secondary)
    ].sort(() => Math.random() - 0.5)
  );

  await channel.send({ embeds: [ballEmbed] });

  const mainMessage = await channel.send({
    content: '<:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>          <:UpsideDownCup:1382593749036695654>',
    components: [row]
  });

  const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 60_000 });

  onAsync(collector, 'collect', async (button) => {
    if (winner) return button.reply({ content: 'Someone has already won.', flags: 64 });
    if (playedUsers.has(button.user.id)) return button.reply({ content: 'Already played.', flags: 64 });
    playedUsers.add(button.user.id);

    if (button.customId === 'ball') {
      winner = button.user;
      collector.stop();
      await button.reply({ content: 'You found the ball!', flags: 64 }).catch(() => {});
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
    } else {
      await button.reply({ content: 'Incorrect!', flags: 64 });
    }
  });
}

async function runEmojiMemory(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const emojis = ['🏊','👡','😎','🌻','🏝️','🕶️','👕','🌴','☀️','👙','🌞','🍹','🏄','🥵','🩱','🩴','🩳','🍦','🍨','🧢','🌄','🌅','🌡️','🌊','🥥']
    .sort(() => Math.random() - 0.5);
  const toShow = emojis.slice(0, 5);

  const mainMessage = await channel.send({ content: 'Memorise the following emojis!' });
  for (const emoji of toShow) {
    await sleep(1500);
    await mainMessage.edit({ content: emoji });
  }

  await sleep(1000);
  const mainEmbed = new EmbedBuilder()
    .setTitle('Memorize')
    .setDescription('Click the emojis in order to win!')
    .setColor(Theme.warning)
    .setFooter({ text: 'You get one try only!' });

  const p = emojis.slice(0, 10).sort(() => Math.random() - 0.5);
  const row = [
    new ActionRowBuilder().addComponents(
      p.slice(0, 5).map((emoji) => new ButtonBuilder().setCustomId(emoji).setEmoji(emoji).setStyle(ButtonStyle.Secondary))
    ),
    new ActionRowBuilder().addComponents(
      p.slice(5, 10).map((emoji) => new ButtonBuilder().setCustomId(emoji).setEmoji(emoji).setStyle(ButtonStyle.Secondary))
    )
  ];

  await mainMessage.edit({ content: '', embeds: [mainEmbed], components: row });

  const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 60_000 });
  const gameData = new Collection();

  onAsync(collector, 'collect', async (button) => {
    if (winner) return button.reply({ content: 'Someone has already won.', flags: 64 });
    if (!gameData.has(button.user.id)) {
      if (playedUsers.has(button.user.id)) return button.reply({ content: 'Already played.', flags: 64 });
      gameData.set(button.user.id, { failed: false, correct: 0, won: false });
    }
    const user = gameData.get(button.user.id);
    if (user.failed) return button.reply({ flags: 64, embeds: [{ description: 'Already failed!', color: Theme.error }] });
    if (user.won) return button.reply({ flags: 64, embeds: [{ description: 'Already won!', color: Theme.success }] });

    if (toShow[user.correct] === button.customId) {
      user.correct++;
      if (user.correct === toShow.length) {
        user.won = true;
        winner = button.user;
        collector.stop();
        await button.reply({ flags: 64, embeds: [{ description: 'You won!', color: Theme.success }] }).catch(() => {});
        const team = await awardPoint(winner.id);
        await sendWinnerEmbed(channel, winner, eventName, team);
      } else {
        await button.reply({ flags: 64, embeds: [{ description: 'Correct! Next...', color: Theme.success }] });
      }
    } else {
      user.failed = true;
      playedUsers.add(button.user.id);
      await button.reply({ flags: 64, embeds: [{ description: 'Incorrect! You lost!', color: Theme.error }] });
    }
  });
}

async function runBasketball(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  let arr = [
    ['<:canvas:1383477236291600525>', '<:canvas:1383477236291600525>', '<:canvas:1383477236291600525>'],
    ['<:blank:914473340129906708>', '<:lebron_james:1383477589670236301>', '<:blank:914473340129906708>'],
    ['<:blank:914473340129906708>', '<:blank:914473340129906708>', '<:blank:914473340129906708>']
  ];

  const row = new ActionRowBuilder().addComponents([
    new ButtonBuilder().setEmoji('🏀').setCustomId('0').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setEmoji('🏀').setCustomId('1').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setEmoji('🏀').setCustomId('2').setStyle(ButtonStyle.Secondary)
  ]);

  arr[1] = shuffle(arr[1]);
  const mainMessage = await channel.send({
    content: arr[0].join('') + '\n' + arr[1].join('') + '\n' + arr[2].join(''),
    components: [row]
  });

  const intervalId = startInterval(channel.client, async () => {
    const shuffledArr = shuffle(arr[1]);
    await mainMessage.edit({
      content: arr[0].join('') + '\n' + shuffledArr.join('') + '\n' + arr[2].join('')
    });
    arr[1] = shuffledArr;
  }, 1000, 'Basketball animation');

  const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 60_000 });

  onAsync(collector, 'collect', async (button) => {
    if (winner) return button.reply({ content: 'Someone has already won.', flags: 64 });
    if (playedUsers.has(button.user.id)) return button.reply({ content: 'Already played.', flags: 64 });
    playedUsers.add(button.user.id);

    const ind = parseInt(button.customId);
    if (arr[1][ind] !== '<:lebron_james:1383477589670236301>') {
      winner = button.user;
      collector.stop();
      await button.reply({ flags: 64, embeds: [{ description: 'You won!', color: Theme.success }] }).catch(() => {});
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
    } else {
      await button.reply({ flags: 64, embeds: [{ description: 'You hit LeBron! Lost!', color: Theme.error }] });
    }
  });

  collector.on('end', () => {
    clearInterval(intervalId);
    channel.client.state.timers.delete(intervalId);
    mainMessage.edit({
      components: [new ActionRowBuilder().addComponents(
        row.components.map((c) => ButtonBuilder.from(c).setDisabled(true))
      )]
    }).catch(() => {});
  });
}

async function runCrabRace(client, channel, eventName, awardPoint, sendWinnerEmbed) {
  const joinEmbed = new EmbedBuilder()
    .setTitle('Crab Race :crab:')
    .setDescription('Click to join! Game starts in 30s')
    .setColor(Theme.warning);

  const joinRow = new ActionRowBuilder().addComponents([
    new ButtonBuilder().setLabel('Join').setCustomId('join;tr').setStyle(ButtonStyle.Success)
  ]);

  const joinMessage = await channel.send({ embeds: [joinEmbed], components: [joinRow] });
  const gamedata = { joined: [], tracks: [] };

  const joinCollector = joinMessage.createMessageComponentCollector({ time: 30_000 });

  onAsync(joinCollector, 'collect', async (button) => {
    if (gamedata.joined.includes(button.user.id)) {
      return button.reply({ content: 'Already joined.', flags: 64 });
    }
    gamedata.joined.push(button.user.id);
    if (gamedata.joined.length === 10) joinCollector.stop();
    await button.reply({ content: 'Joined!', flags: 64 });
  });

  onAsync(joinCollector, 'end', async () => {
    joinEmbed.setDescription('Game starting!');
    await joinMessage.edit({ embeds: [joinEmbed], components: [] });

    if (gamedata.joined.length < 2) {
      return channel.send('Need at least 2 players.');
    }

    for (const userId of gamedata.joined) {
      gamedata.tracks.push({
        user: client.users.cache.get(userId),
        track: Array(37).fill('●')
      });
    }

    let description = gamedata.tracks.map((t) => `**${t.user.tag}**:\n:squid:${t.track.join(' ')} :crab:`).join('\n');
    const mainMessage = await channel.send({
      embeds: [{ description, title: 'Crab Race', color: Theme.success, timestamp: new Date() }]
    });

    let end = false;
    let eventWinner = null;
    for (let i = 0; i < 50; i++) {
      if (end) break;
      for (const track of gamedata.tracks) {
        const rand = Math.ceil(Math.random() * 10);
        let blocks = rand < 6 ? 2 : rand < 10 ? 3 : 5;
        if (track.track.length <= blocks && !eventWinner) {
          blocks = track.track.length;
          end = true;
          eventWinner = track;
        }
        track.track.splice(0, blocks);
      }
      await sleep(2500);
      description = gamedata.tracks.map((t) =>
        `**${t.user.tag}**:\n${t.track.length < 1 ? ':crown:' : ':squid:'}${t.track.join(' ')} :crab:`
      ).join('\n');
      mainMessage.edit({
        embeds: [{ description, title: 'Crab Race', color: Theme.success, timestamp: new Date() }]
      }).catch(() => {});
    }

    if (eventWinner) {
      const team = await awardPoint(eventWinner.user.id);
      await sendWinnerEmbed(channel, eventWinner.user, eventName, team);
    }
  });
}

async function runHigherOrLower(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  let reference = Math.floor(Math.random() * 99) + 1;
  if (reference >= randomNumber) reference++;

  const embed = new EmbedBuilder()
    .setTitle('Higher or Lower')
    .setDescription(`Is it Higher or Lower than **${reference}**?`)
    .setColor(Theme.warning);

  const row = new ActionRowBuilder().addComponents([
    new ButtonBuilder().setLabel('Higher').setCustomId('hol_high').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setLabel('Lower').setCustomId('hol_low').setStyle(ButtonStyle.Danger)
  ]);

  const mainMessage = await channel.send({ embeds: [embed], components: [row] });
  const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 60_000 });

  onAsync(collector, 'collect', async (button) => {
    if (winner) return button.reply({ content: 'Someone already won.', flags: 64 });
    if (playedUsers.has(button.user.id)) return button.reply({ content: 'Already played.', flags: 64 });
    playedUsers.add(button.user.id);

    const isHigh = button.customId === 'hol_high';
    if ((isHigh && randomNumber > reference) || (!isHigh && randomNumber < reference)) {
      winner = button.user;
      collector.stop();
      await button.reply({ content: `Correct! The number was ${randomNumber}`, flags: 64 }).catch(() => {});
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
    } else {
      await button.reply({ content: `Wrong! The number was ${randomNumber}`, flags: 64 });
    }
  });
}

async function runUnscramble(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const req = await fetch('https://random-word-api.vercel.app/api?words=1&length=4', {
    signal: AbortSignal.timeout(15_000)
  });
  if (!req.ok) throw new Error(`Word API failed (${req.status})`);
  const word = (await req.json())?.[0]?.toLowerCase();
  if (!/^[a-z]{4}$/.test(word || '') || new Set(word).size < 2) {
    throw new Error('Word API returned an invalid word');
  }
  let scrambled = shuffle(word.split('')).join('');
  // A rotation guarantees a different spelling without an unbounded RNG loop.
  if (scrambled === word) scrambled = scrambled.slice(1) + scrambled[0];

  const embed = new EmbedBuilder()
    .setTitle('Guess the word!')
    .setColor(Theme.warning)
    .setDescription(`Scrambled: **\`${scrambled}\`**`);

  await channel.send({ embeds: [embed] });

  const collector = channel.createMessageCollector({ time: 30_000 });

  onAsync(collector, 'collect', async (msg) => {
    if (winner || playedUsers.has(msg.author.id) || msg.author.bot) return;

    if (msg.content.toLowerCase() === word) {
      winner = msg.author;
      collector.stop();
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
      await msg.reply({ embeds: [{ title: 'Correct! Word: ' + word, color: Theme.success }] });
    } else {
      playedUsers.add(msg.author.id);
      await msg.react('❌');
    }
  });
}

async function runRPS(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const embed = new EmbedBuilder().setTitle('Rock, Paper, Scissors').setDescription('Choose your weapon!').setColor(Theme.warning);

  const row = new ActionRowBuilder().addComponents([
    new ButtonBuilder().setCustomId('rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Primary)
  ]);

  const mainMessage = await channel.send({ embeds: [embed], components: [row] });
  const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 60_000 });

  onAsync(collector, 'collect', async (button) => {
    if (winner) return button.reply({ content: 'Someone already won.', flags: 64 });
    if (playedUsers.has(button.user.id)) return button.reply({ content: 'Already played.', flags: 64 });
    playedUsers.add(button.user.id);

    const userChoice = button.customId;
    const botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];

    const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    let result;
    if (userChoice === botChoice) {
      result = "It's a tie!";
    } else if (wins[userChoice] === botChoice) {
      result = 'You win!';
      winner = button.user;
      collector.stop();
    } else {
      result = 'You lose!';
    }

    await button.reply({ content: `You chose ${userChoice}, bot chose ${botChoice}. ${result}`, flags: 64 }).catch(() => {});
    if (winner?.id === button.user.id) {
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
    }
  });
}

async function runGuessTheNumber(channel, winner, playedUsers, eventName, awardPoint, sendWinnerEmbed) {
  const randomNumber = Math.floor(Math.random() * 10) + 1;

  const embed = new EmbedBuilder()
    .setTitle('Guess the Number!')
    .setDescription('I picked a number between 1 and 10.')
    .setColor(Theme.warning);

  await channel.send({ embeds: [embed] });

  const collector = channel.createMessageCollector({ filter: (m) => !m.author.bot, time: 30_000 });

  onAsync(collector, 'collect', async (msg) => {
    if (winner || playedUsers.has(msg.author.id)) return;
    if (!/^\d+$/.test(msg.content.trim())) return;
    const guess = Number(msg.content.trim());
    if (guess < 1 || guess > 10) return;

    if (guess === randomNumber) {
      winner = msg.author;
      collector.stop();
      const team = await awardPoint(winner.id);
      await sendWinnerEmbed(channel, winner, eventName, team);
      await msg.reply({ content: `🎉 Correct! It was ${randomNumber}.` });
    } else {
      playedUsers.add(msg.author.id);
      await msg.react('❌');
    }
  });

  collector.on('end', (_, reason) => {
    if (reason === 'time') channel.send(`Game over! Number was ${randomNumber}.`).catch(() => {});
  });
}
