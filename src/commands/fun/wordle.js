const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'wordle',

  async execute(message, args, client) {
    let row = 0;
    const randomWord = await getRandomWord();
    const rows = [];

    for (let i = 0; i < 5; i++) {
      rows.push(
        new ActionRowBuilder().setComponents(
          Array.from({ length: 5 }, (_, j) =>
            new ButtonBuilder()
              .setCustomId(`row_${i}_button_${j}`)
              .setEmoji(config.ids.emojis.blank)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          )
        )
      );
    }

    const GameMessage = await message.reply({ components: rows });

    const gameCollector = message.channel.createMessageCollector({
      filter: (user) => user.author.id === message.author.id,
      idle: 2 * 60 * 1000
    });

    gameCollector.on('collect', async (msg) => {
      if (msg.content.length != 5) {
        await msg.reply('Word should be 5 characters long!');
        return;
      }

      const checkValid = await checkValidWord(msg.content);
      if (!checkValid) {
        await msg.reply('This is not a real word!');
        return;
      }
      const guess = msg.content.toLowerCase();
      rows[row] = new ActionRowBuilder();
      for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        let color;
        if (letter == randomWord[i]) {
          color = ButtonStyle.Success;
        } else if (randomWord.includes(letter)) {
          color = ButtonStyle.Primary;
        } else {
          color = ButtonStyle.Secondary;
        }

        rows[row].addComponents([
          new ButtonBuilder()
            .setCustomId(`row_${row}_button_${i}`)
            .setLabel(letter)
            .setStyle(color)
            .setDisabled(true)
        ]);
      }
      row++;
      await GameMessage.edit({ components: rows });
      if (guess === randomWord) {
        await msg.reply('Congratulations! You guessed the word correctly!');
        gameCollector.stop();
        return;
      }

      if (row >= 5) {
        gameCollector.stop();
        await msg.reply(`You lost! The word was ${randomWord}`);
      }
    });
  }
};

const getRandomWord = async () => {
  const req = await fetch('https://random-word-api.herokuapp.com/word?length=5');
  const json = await req.json();
  return json[0];
};

const checkValidWord = async (word) => {
  const req = await fetch(
    'https://api.dictionaryapi.dev/api/v2/entries/en/' + word
  );
  const json = await req.json();
  return !!json[0];
};
