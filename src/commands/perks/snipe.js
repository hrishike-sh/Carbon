const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'snipe',
  cooldown: 5,
  roles: [
    '826196972167757875',
    '969870378811916408',
    '825283097830096908',
    '839803117646512128',
    '824687393868742696',
    '999911429421408346',
    '828048225096826890',
    '826002228828700718',
    '999911166673428521'
  ],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const snipes = client.snipes.snipes.get(message.channel.id);

    if (!snipes) {
      return message.reply('There is nothing to be sniped!');
    }

    let index = +args[0] - 1 || 0;
    let target = snipes[index];
    let { msg, time, image } = target;

    let snipeEmbed = new EmbedBuilder()
      .setAuthor({
        name: msg.author.tag || 'Unknown',
        iconURL: msg.author.displayAvatarURL()
      })
      .setDescription(msg.content)
      .setColor('Random')
      .setImage(image)
      .setFooter({
        text: `${index + 1}/${snipes.length}`
      })
      .setTimestamp(time);

    let prevBut = new ButtonBuilder()
      .setEmoji('911971090954326017')
      .setCustomId('prev-snipe')
      .setStyle(ButtonStyle.Success);
    let delBut = new ButtonBuilder()
      .setEmoji('🗑')
      .setCustomId('del-snipe')
      .setStyle(ButtonStyle.Primary);
    let nextBut = new ButtonBuilder()
      .setEmoji('911971202048864267')
      .setCustomId('next-snipe')
      .setStyle(ButtonStyle.Success);
    let row = new ActionRowBuilder().addComponents([prevBut, delBut, nextBut]);

    const mainMessage = await message.reply({
      embeds: [snipeEmbed],
      components: [row]
    });
    const collector = mainMessage.createMessageComponentCollector({
      idle: 15_000
    });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({
          content: 'This is not your command.',
          ephemeral: true
        });
      }

      const id = button.customId;
      if (id == 'prev-snipe') {
        index--;
        if (index < 0) index = snipes.length - 1;

        target = snipes[index];
        let { msg, time, image } = target;

        snipeEmbed = new EmbedBuilder()
          .setAuthor({
            name: msg.author.tag,
            iconURL: msg.author.displayAvatarURL() || null
          })
          .setDescription(msg.content)
          .setColor('Random')
          .setFooter({ text: `${snipe + 1}/${sniped.length}` })
          .setImage(image)
          .setTimestamp(time);

        return button.update({
          embeds: [snipeEmbed],
          components: [row]
        });
      } else if (id == 'next-snipe') {
        index++;
        if (index == snipes.length) index = 0;

        target = snipes[index];
        let { msg, time, image } = target;

        snipeEmbed = new EmbedBuilder()
          .setAuthor({
            name: msg.author.tag,
            iconURL: msg.author.displayAvatarURL() || null
          })
          .setDescription(msg.content)
          .setColor('Random')
          .setFooter({ text: `${index + 1}/${snipes.length}` })
          .setImage(image)
          .setTimestamp(time);

        return button.update({
          embeds: [snipeEmbed],
          components: [row]
        });
      } else {
        await button.deferUpdate();
        await button.message.delete();
        return;
      }
    });

    collector.on('end', () => {
      if (mainMessage.editable) {
        prevBut.setDisabled();
        delBut.setDisabled();
        nextBut.setDisabled();

        mainMessage.edit({
          components: [row]
        });
      } else return;
    });
  }
};
