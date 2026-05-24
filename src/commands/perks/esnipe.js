const {
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'esnipe',
  cooldown: 5,
  roles: [config.roles.staff.mod, config.roles.staff.admin, config.roles.giveawayManager],

  async execute(message, args, client) {
    const sniped = client.state.snipes.esnipes.get(message.channel.id);

    if (!sniped) {
      return message.channel.send('There is nothing to snipe!');
    }

    let snipe = +args[0] - 1 || 0;
    let target = sniped[snipe];
    let { msg, oldContent, newContent } = target;

    let snipeBed = new EmbedBuilder()
      .setAuthor({
        name: msg.author.tag,
        iconURL: msg.author.displayAvatarURL() || null
      })
      .addFields([{ name: 'Old Message', value: oldContent, inline: true }])
      .addFields([{ name: 'New Message', value: newContent, inline: true }])
      .setColor('Random')
      .setFooter({ text: `${snipe + 1}/${sniped.length}` });

    const prevBut = new ButtonBuilder()
      .setEmoji('911971090954326017')
      .setCustomId('prev-snipe')
      .setStyle(ButtonStyle.Success);
    const deleteBut = new ButtonBuilder()
      .setEmoji('🗑️')
      .setCustomId('delete-snipe')
      .setStyle(ButtonStyle.Success);
    const nextBut = new ButtonBuilder()
      .setEmoji('911971202048864267')
      .setCustomId('next-snipe')
      .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents([prevBut, deleteBut, nextBut]);

    const mainMessage = await message.channel.send({
      content: 'Use the buttons to navigate.',
      embeds: [snipeBed],
      components: [row]
    });

    const collector = mainMessage.createMessageComponentCollector({ idle: 30000 });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({ ephemeral: true, content: 'This is not for you' });
      }
      const id = button.customId;
      button.deferUpdate();
      if (id === 'prev-snipe') {
        snipe--;
        if (snipe < 0) snipe = sniped.length - 1;
        target = sniped[snipe];
        ({ msg, oldContent, newContent } = target);
        snipeBed = new EmbedBuilder()
          .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() || null })
          .addFields([{ name: 'Old Message', value: oldContent, inline: true }])
          .addFields([{ name: 'New Message', value: newContent, inline: true }])
          .setColor('Random')
          .setFooter({ text: `${snipe + 1}/${sniped.length}` });
        return mainMessage.edit({ content: 'Use the buttons to navigate.', embeds: [snipeBed], components: [row] });
      } else if (id === 'next-snipe') {
        snipe++;
        if (snipe >= sniped.length) snipe = 0;
        target = sniped[snipe];
        ({ msg, oldContent, newContent } = target);
        snipeBed = new EmbedBuilder()
          .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() || null })
          .addFields([{ name: 'Old Message', value: oldContent, inline: true }])
          .addFields([{ name: 'New Message', value: newContent, inline: true }])
          .setColor('Random')
          .setFooter({ text: `${snipe + 1}/${sniped.length}` });
        return mainMessage.edit({ content: 'Use the buttons to navigate.', embeds: [snipeBed], components: [row] });
      } else {
        mainMessage.delete();
      }
    });

    collector.on('end', () => {
      prevBut.setDisabled();
      nextBut.setDisabled();
      deleteBut.setDisabled();
      try {
        mainMessage.edit({
          content: 'Use the buttons to navigate.',
          embeds: [snipeBed],
          components: [new ActionRowBuilder().addComponents([prevBut, deleteBut, nextBut])]
        });
      } catch {}
    });
  }
};
