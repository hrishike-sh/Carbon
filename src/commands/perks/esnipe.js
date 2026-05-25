const {
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder
} = require('discord.js');
const config = require('../../config');
const { createEmbed } = require('../../utils/embeds');

function buildESnipeEmbed(target, index, total) {
  const { author, oldContent, newContent } = target;
  return createEmbed({
    color: 'Random',
    author: author ? { name: author.tag, iconURL: author.displayAvatarURL() || null } : { name: 'Unknown' },
    fields: [
      { name: 'Old Message', value: oldContent || '*[no content]*', inline: true },
      { name: 'New Message', value: newContent || '*[no content]*', inline: true }
    ],
    footer: `${index + 1}/${total}`
  });
}

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
    let snipeBed = buildESnipeEmbed(sniped[snipe], snipe, sniped.length);

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
        snipeBed = buildESnipeEmbed(sniped[snipe], snipe, sniped.length);
        return mainMessage.edit({ content: 'Use the buttons to navigate.', embeds: [snipeBed], components: [row] });
      } else if (id === 'next-snipe') {
        snipe++;
        if (snipe >= sniped.length) snipe = 0;
        snipeBed = buildESnipeEmbed(sniped[snipe], snipe, sniped.length);
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
