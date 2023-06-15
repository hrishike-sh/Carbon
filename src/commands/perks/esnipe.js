const {
  Message,
  Client,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  name: 'esnipe',
  cooldown: 5,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const sniped = client.snipes.esnipes.get(message.channel.id);

    if (!sniped || sniped == undefined) {
      message.channel.send('There is nothing to snipe!');
      return;
    }

    let snipe = +args[0] - 1 || 0;

    let target = sniped[snipe];

    let { msg, editedIn, oldContent, newContent } = target;

    let snipeBed = new EmbedBuilder()
      .setAuthor({
        name: msg.author.tag,
        iconURL: msg.author.displayAvatarURL() || null
      })
      .addFields([{ name: 'Old Message', value: oldContent, inline: true }])
      .addFields([{ name: 'New Message', value: newContent, inline: true }])
      .setColor('Random')
      .setFooter({ text: `${snipe + 1}/${sniped.length}` });
    let prevBut = new ButtonBuilder()
      .setEmoji('911971090954326017')
      .setCustomId('prev-snipe')
      .setStyle(ButtonStyle.Success);
    let nextBut = new ButtonBuilder()
      .setEmoji('911971202048864267')
      .setCustomId('next-snipe')
      .setStyle(ButtonStyle.Success);
    let row = new ActionRowBuilder().addComponents([prevBut, nextBut]);

    const mainMessage = await message.channel.send({
      content: 'Use the buttons to navigate.',
      embeds: [snipeBed],
      components: [row]
    });

    const collector = mainMessage.createMessageComponentCollector({
      idle: 30000
    });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({
          ephemeral: true,
          content: 'This is not for you'
        });
      }
      const id = button.customId;
      button.deferUpdate();
      if (id === 'prev-snipe') {
        snipe--;
        if (snipe < 0) {
          snipe = snipe.length - 1;
        }
        target = sniped[snipe];
        let { msg, editedIn, oldContent, newContent } = target;
        snipeBed = new EmbedBuilder()
          .setAuthor({
            name: msg.author.tag,
            iconURL: msg.author.displayAvatarURL() || null
          })
          .addFields([
            {
              name: 'Old Message',
              value: oldContent,
              inline: true
            }
          ])
          .addFields([{ name: 'New Message', value: newContent, inline: true }])
          .setColor('Random')
          .setFooter({ text: `${snipe + 1}/${sniped.length}` });

        return mainMessage.edit({
          content: 'Use the buttons to navigate.',
          embeds: [snipeBed],
          components: [row]
        });
      } else {
        snipe++;
        if (snipe > sniped.length || snipe == sniped.length) {
          snipe = 0;
        }
        target = sniped[snipe];
        let { msg, editedIn, oldContent, newContent } = target;
        snipeBed = new EmbedBuilder()
          .setAuthor({
            name: msg.author.tag,
            iconURL: msg.author.displayAvatarURL() || null
          })
          .addFields([
            {
              name: 'Old Message',
              value: oldContent,
              inline: true
            }
          ])
          .addFields([{ name: 'New Message', value: newContent, inline: true }])
          .setColor('Random')
          .setFooter({ text: `${snipe + 1}/${sniped.length}` });

        return mainMessage.edit({
          content: 'Use the buttons to navigate.',
          embeds: [snipeBed],
          components: [row]
        });
      }
    });

    collector.on('end', () => {
      prevBut = prevBut.setDisabled();
      nextBut = nextBut.setDisabled();
      row = new ActionRowBuilder().addComponents([prevBut, nextBut]);
      target = sniped[snipe];
      let { msg, editedIn, oldContent, newContent } = target;
      snipeBed = new EmbedBuilder()
        .setAuthor({
          name: msg.author.tag,
          iconURL: msg.author.displayAvatarURL() || null
        })
        .addFields([{ name: 'Old Message', value: oldContent, inline: true }])
        .addFields([{ name: 'New Message', value: newContent, inline: true }])
        .setColor('Random')
        .setFooter({ text: `${snipe + 1}/${sniped.length}` });
      try {
        mainMessage.edit({
          content: 'Use the buttons to navigate.',
          embeds: [snipeBed],
          components: [row]
        });
      } catch (e) {}
    });
  }
};
