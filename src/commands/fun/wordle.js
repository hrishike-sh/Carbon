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

    const rows = [];

    for (let i = 0; i < 5; i++) {
      rows.push(
        new ActionRowBuilder().setComponents([
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_0`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_1`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_2`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_3`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`row_${i}_button_4`)
            .setEmoji('914473340129906708')
            .setStyle(ButtonStyle.Secondary)
        ])
      );
    }

    const GameMessage = await message.reply({
      components: rows
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
