const {
  Message,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} = require('discord.js');

module.exports = {
  name: 'battleroyale',
  aliases: ['br'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (message.author.id !== '598918643727990784') return;

    const conf_embed = new EmbedBuilder()
      .setTitle('Battle Royale')
      .setDescription('Click the `JOIN` button to join!\n\nMax Players: 25')
      .setFooter({
        text: 'Game starts in 10 seconds.'
      })
      .setColor(Colors.Gold);
    const conf_row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setLabel('JOIN')
        .setStyle(ButtonStyle.Success)
        .setCustomId('br_join')
    ]);
    const joinMessage = await message.channel.send({
      embeds: [conf_embed],
      components: [conf_row]
    });
    const data = {
      joined: []
    };
    const joinCollector = joinMessage.createMessageComponentCollector({
      filter: (m) => {
        if (data.joined.map((a) => a.id).includes(m.user.id)) {
          m.reply({
            ephemeral: true,
            content: 'You have already joined the game.'
          });
          return false;
        }
      },
      time: 10 * 1000
    });

    joinCollector.on('collect', async (m) => {
      if (data.joined.length > 24) {
        joinCollector.stop();
        return;
      }
      data.joined.push({
        id: m.user.id,
        name: m.user.tag,
        health: 100
      });
      await m.reply({
        ephemeral: true,
        content: 'You have joined the game.'
      });
    });
    joinCollector.on('end', async () => {
      if (data.joined.length < 3) {
        return message.reply('You need atleast 4 players to play.');
      }
      const embedData = breakArray(data.joined);
      const mainRow = [
        new ActionRowBuilder(),
        new ActionRowBuilder(),
        new ActionRowBuilder(),
        new ActionRowBuilder(),
        new ActionRowBuilder()
      ];
      for (let i = 0; i < embedData.length; i++) {
        embedData[i].forEach((a) => {
          mainRow[i].addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Primary)
              .setCustomId(`br_${a.id}`)
              .setLabel(a.name)
          );
        });
      }
      return message.reply({
        components: mainRow,
        content: 'Test'
      });
    });
  }
};
const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 5) {
    chunks.push(array.slice(i, i + 5));
  }
  return chunks;
};
