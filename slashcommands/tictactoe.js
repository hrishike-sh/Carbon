const {
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonInteraction,
  ButtonStyle,
  SlashCommandBuilder
} = require('discord.js');

module.exports = {
  category: 'Fights',
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Start a game of tictactoe with someone!')
    .addUserOption((opt) => {
      return opt
        .setName('user')
        .setRequired(true)
        .setDescription('Mention the user you want to fight with.');
    })
    .addBooleanOption((o) => {
      return o
        .setRequired(false)
        .setName('buttons')
        .setDescription('Should the game use buttons? Default: true');
    }),
  /**
   *
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    const data = {
      opponent: interaction.options.getUser('user'),
      buttons: interaction.options.getBoolean('buttons') || null
    };
    if (data.opponent.id === interaction.user.id)
      return interaction.reply({
        content: 'You cant fight yourself',
        ephemeral: true
      });
    const gamedata = {
      user1: {
        user: interaction.user,
        symbol: 'x',
        emoji: '❌'
      },
      user2: {
        user: data.opponent,
        symbol: 'o',
        emoji: '⭕'
      }
    };

    let gameBoard = {
      a: {
        a1: null,
        a2: null,
        a3: null
      },
      b: {
        b1: null,
        b2: null,
        b3: null
      },
      c: {
        c1: null,
        c2: null,
        c3: null
      }
    };

    const checkWin = (g) => {
      if (
        (g.a.a1 == 'x' && g.a.a2 == 'x' && g.a.a3 == 'x') ||
        (g.b.b1 == 'x' && g.b.b2 == 'x' && g.b.b3 == 'x') ||
        (g.c.c1 == 'x' && g.c.c2 == 'x' && g.c.c3 == 'x') ||
        (g.a.a1 == 'x' && g.b.b1 == 'x' && g.c.c1 == 'x') ||
        (g.a.a2 == 'x' && g.b.b2 == 'x' && g.b.c2 == 'x') ||
        (g.a.a3 == 'x' && g.b.b3 == 'x' && g.b.c3 == 'x') ||
        (g.a.a1 == 'x' && g.b.b2 == 'x' && g.c.c3 == 'x') ||
        (g.a.a3 == 'x' && g.b.b2 == 'x' && g.c.c1 == 'x')
      ) {
        return { win: true, winner: 'x' };
      } else if (
        (g.a.a1 == 'o' && g.a.a2 == 'o' && g.a.a3 == 'o') ||
        (g.b.b1 == 'o' && g.b.b2 == 'o' && g.b.b3 == 'o') ||
        (g.c.c1 == 'o' && g.c.c2 == 'o' && g.c.c3 == 'o') ||
        (g.a.a1 == 'o' && g.b.b1 == 'o' && g.c.c1 == 'o') ||
        (g.a.a2 == 'o' && g.b.b2 == 'o' && g.b.c2 == 'o') ||
        (g.a.a3 == 'o' && g.b.b3 == 'o' && g.b.c3 == 'o') ||
        (g.a.a1 == 'o' && g.b.b2 == 'o' && g.c.c3 == 'o') ||
        (g.a.a3 == 'o' && g.b.b2 == 'o' && g.c.c1 == 'o')
      ) {
        return { win: true, winner: 'o' };
      } else if (
        g.a.a1 &&
        g.a.a2 &&
        g.a.a3 &&
        g.b.b1 &&
        g.b.b2 &&
        g.b.b3 &&
        g.c.c1 &&
        g.c.c2 &&
        g.c.c3
      ) {
        return { win: true, tie: true };
      } else return { win: false };
    };

    let a1But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('a1')
      .setStyle(ButtonStyle.Secondary);
    let a2But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('a2')
      .setStyle(ButtonStyle.Secondary);
    let a3But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('a3')
      .setStyle(ButtonStyle.Secondary);
    let arow = new ActionRowBuilder().addComponents([a1But, a2But, a3But]);

    let b1But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('b1')
      .setStyle(ButtonStyle.Secondary);
    let b2But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('b2')
      .setStyle(ButtonStyle.Secondary);
    let b3But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('b3')
      .setStyle(ButtonStyle.Secondary);
    let brow = new ActionRowBuilder().addComponents([b1But, b2But, b3But]);

    let c1But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('c1')
      .setStyle(ButtonStyle.Secondary);
    let c2But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('c2')
      .setStyle(ButtonStyle.Secondary);
    let c3But = new ButtonBuilder()
      .setEmoji('914473340129906708')
      .setCustomId('c3')
      .setStyle(ButtonStyle.Secondary);
    let crow = new ActionRowBuilder().addComponents([c1But, c2But, c3But]);

    const ids = [interaction.user.id, data.opponent.id];
    let current = ids[Math.floor(Math.random() * 2)];

    interaction.reply({ content: 'The game has started.' });
    const message = await interaction.channel.send({
      content: `<@${current}> your turn!`,
      components: [arow, brow, crow]
    });

    const mainCollector = message.createMessageComponentCollector({});

    mainCollector.on('collect', async (button) => {
      if (![interaction.user.id, data.opponent.id].includes(button.user.id)) {
        return button.reply({
          content: 'This is not your game.',
          ephemeral: true
        });
      }

      if (current !== button.user.id) {
        return button.reply({
          content: 'Not your turn.',
          ephemeral: true
        });
      }

      const player =
        button.user.id === gamedata.user1.user.id
          ? gamedata.user1
          : gamedata.user2;

      const id = button.customId;
      let gameButton;

      button.deferUpdate();

      if (id.startsWith('a')) {
        gameBoard['a'][id] = player.symbol;
        gameButton = arow.components.filter((a) => a.customId === id);
      } else if (id.startsWith('b')) {
        gameBoard['b'][id] = player.symbol;
        gameButton = brow.components.filter((b) => b.customId === id);
      } else {
        gameBoard['c'][id] = player.symbol;
        gameButton = crow.components.filter((c) => c.customId === id);
      }
      gameButton[0].setDisabled();
      gameButton[0].setEmoji(player.emoji);
      gameButton[0].setStyle(
        player.symbol === 'x' ? ButtonStyle.Danger : ButtonStyle.Primary
      );
      current = ids.filter((a) => a !== current)[0];
      const win = checkWin(gameBoard);
      if (win.win) {
        mainCollector.stop();
        if (win.tie) {
          arow.components.forEach((c) => c.setDisabled());
          brow.components.forEach((c) => c.setDisabled());
          crow.components.forEach((c) => c.setDisabled());

          return message.edit({
            components: [arow, brow, crow],
            content: "It's a tie!"
          });
        }
        arow.components.forEach((c) => c.setDisabled());
        brow.components.forEach((c) => c.setDisabled());
        crow.components.forEach((c) => c.setDisabled());
        return message.edit({
          content: `<@${player.user.id}> has won!`,
          components: [arow, brow, crow]
        });
      } else {
        message.edit({
          content: `<@${current}> your turn!`,
          components: [arow, brow, crow]
        });
      }
    });
  }
};
