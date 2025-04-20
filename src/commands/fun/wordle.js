const {
  Message,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'wordle',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    let row = 0;
    const randomWord = await getRandomWord();
    console.log(randomWord);
    const rows = [];

    for (let i = 0; i < 5; i++) {
      rows.push(
        new ActionRowBuilder().setComponents([
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_0`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_1`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_2`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_3`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_4`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        ])
      );
    }

    const GameMessage = await message.reply({
      components: rows
    });

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
      const guess = msg.content;
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
      await GameMessage.edit({
        components: rows
      });
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
  const randomWordApi = 'https://random-word-api.herokuapp.com/word?length=5';

  const req = await fetch(randomWordApi);
  const json = await req.json();
  const word = json[0];

  return word;
};

const checkValidWord = async (word) => {
  const checkWordAPI =
    'https://api.dictionaryapi.dev/api/v2/entries/en/' + word;
  const req = await fetch(checkWordAPI);
  const json = await req.json();

  return !!json[0];
};
