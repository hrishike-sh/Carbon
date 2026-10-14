const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const logger = require('../../utils/logger');

const activeGames = new Set();
const WORD_PATTERN = /^[a-z]{5}$/i;

function scoreGuess(guess, answer) {
  const styles = Array(5).fill(ButtonStyle.Secondary);
  const remaining = new Map();
  for (let index = 0; index < 5; index++) {
    if (guess[index] === answer[index]) styles[index] = ButtonStyle.Success;
    else remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1);
  }
  for (let index = 0; index < 5; index++) {
    if (styles[index] === ButtonStyle.Success) continue;
    const count = remaining.get(guess[index]) || 0;
    if (count > 0) {
      styles[index] = ButtonStyle.Primary;
      remaining.set(guess[index], count - 1);
    }
  }
  return styles;
}

async function getRandomWord() {
  const response = await fetch('https://random-word-api.herokuapp.com/word?length=5', {
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Random word service returned ${response.status}`);
  const words = await response.json();
  if (!Array.isArray(words) || typeof words[0] !== 'string' || !WORD_PATTERN.test(words[0])) {
    throw new Error('Random word service returned an invalid word');
  }
  return words[0].toLowerCase();
}

async function checkValidWord(word) {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    signal: AbortSignal.timeout(10_000)
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Dictionary service returned ${response.status}`);
  const entries = await response.json();
  return Array.isArray(entries) && entries.length > 0;
}

module.exports = {
  name: 'wordle',
  async execute(message) {
    const key = `${message.channel.id}:${message.author.id}`;
    if (activeGames.has(key)) return message.reply('You already have a Wordle game in this channel.');
    activeGames.add(key);
    let collector;
    try {
      const answer = await getRandomWord();
      let row = 0;
      const rows = Array.from({ length: 5 }, (_, rowIndex) => new ActionRowBuilder().setComponents(
        Array.from({ length: 5 }, (_, index) => new ButtonBuilder()
          .setCustomId(`row_${rowIndex}_button_${index}`)
          .setEmoji(config.ids.emojis.blank)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true))
      ));
      const gameMessage = await message.reply({ components: rows });
      collector = message.channel.createMessageCollector({
        filter: (guess) => guess.author.id === message.author.id && !guess.author.bot,
        idle: 2 * 60 * 1000,
        time: 10 * 60 * 1000
      });
      let pendingGuess = Promise.resolve();
      const validity = new Map();
      collector.on('collect', (msg) => {
        // Dictionary lookups can resolve out of order. Process guesses in receipt
        // order and stop queued guesses at the fifth row or a win.
        pendingGuess = pendingGuess.then(async () => {
          if (collector.ended) return;
          const guess = msg.content.trim().toLowerCase();
          if (!WORD_PATTERN.test(guess)) {
            await msg.reply('Enter a word with five letters.');
            return;
          }
          if (guess !== answer && !validity.has(guess)) {
            try {
              validity.set(guess, await checkValidWord(guess));
            } catch (error) {
              if (collector.ended) return;
              await msg.reply('The dictionary is unavailable. Please try that guess again.');
              return;
            }
          }
          if (collector.ended) return;
          if (guess !== answer && !validity.get(guess)) {
            await msg.reply('This is not a real word!');
            return;
          }
          const styles = scoreGuess(guess, answer);
          rows[row] = new ActionRowBuilder().setComponents(
            [...guess].map((letter, index) => new ButtonBuilder()
              .setCustomId(`row_${row}_button_${index}`)
              .setLabel(letter)
              .setStyle(styles[index])
              .setDisabled(true))
          );
          row++;
          const won = guess === answer;
          if (won || row === 5) collector.stop(won ? 'won' : 'lost');
          await gameMessage.edit({ components: rows });
          if (won) await msg.reply('Congratulations! You guessed the word correctly!');
          else if (row === 5) await msg.reply(`You lost! The word was ${answer}`);
        }).catch((error) => {
          logger.error('Wordle guess failed', error);
          collector.stop('error');
        });
      });
      collector.once('end', (_, reason) => {
        activeGames.delete(key);
        if (reason === 'idle' || reason === 'time') {
          message.reply(`Wordle expired. The word was ${answer}.`).catch(() => {});
        }
      });
    } catch (error) {
      if (collector) collector.stop('error');
      activeGames.delete(key);
      logger.error('Wordle could not start', error);
      return message.reply('I could not start Wordle. Please try again later.');
    }
  }
};
