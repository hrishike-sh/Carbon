const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'snipe',
  cooldown: 5,

  async execute(message, args, client) {
    if (message.guild.id !== config.ids.guildId) {
      return message.reply('This command is not available in this server.');
    }

    const hasRole = [
      config.roles.staff.mod,
      config.roles.staff.admin,
      config.roles.giveawayManager
    ].some((roleId) => message.member.roles.cache.has(roleId));
    if (!hasRole) {
      return message.reply('You do not have permission to use this command.');
    }

    const channelId = message.mentions.channels?.first()?.id || message.channel.id;
    const snipes = client.state.snipes.snipes.get(channelId);

    if (!snipes) {
      return message.reply('There is nothing to be sniped!');
    }

    let index = +args[0] - 1 || 0;
    let target = snipes[index];
    let { msg, time, image } = target;

    let snipeEmbed = new EmbedBuilder()
      .setAuthor({ name: msg.author.tag || 'Unknown', iconURL: msg.author.displayAvatarURL() })
      .setDescription(msg.content)
      .setColor('Random')
      .setImage(image)
      .setFooter({ text: `${index + 1}/${snipes.length}` })
      .setTimestamp(time);

    const prevBut = new ButtonBuilder()
      .setEmoji('911971090954326017')
      .setCustomId('prev-snipe')
      .setStyle(ButtonStyle.Success);
    const delBut = new ButtonBuilder()
      .setEmoji('🗑')
      .setCustomId('del-snipe')
      .setStyle(ButtonStyle.Primary);
    const nextBut = new ButtonBuilder()
      .setEmoji('911971202048864267')
      .setCustomId('next-snipe')
      .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents([prevBut, delBut, nextBut]);

    const mainMessage = await message.reply({ embeds: [snipeEmbed], components: [row] });
    const collector = mainMessage.createMessageComponentCollector({ idle: 15_000 });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({ content: 'This is not your command.', ephemeral: true });
      }

      const id = button.customId;
      if (id === 'prev-snipe') {
        index--;
        if (index < 0) index = snipes.length - 1;
        target = snipes[index];
        ({ msg, time, image } = target);
        snipeEmbed = new EmbedBuilder()
          .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() || null })
          .setDescription(msg.content)
          .setColor('Random')
          .setFooter({ text: `${index + 1}/${snipes.length}` })
          .setImage(image)
          .setTimestamp(time);
        button.deferUpdate();
        return mainMessage.edit({ embeds: [snipeEmbed], components: [row] });
      } else if (id === 'next-snipe') {
        index++;
        if (index === snipes.length) index = 0;
        target = snipes[index];
        ({ msg, time, image } = target);
        snipeEmbed = new EmbedBuilder()
          .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() || null })
          .setDescription(msg.content)
          .setColor('Random')
          .setFooter({ text: `${index + 1}/${snipes.length}` })
          .setImage(image)
          .setTimestamp(time);
        button.deferUpdate();
        return mainMessage.edit({ embeds: [snipeEmbed], components: [row] });
      } else {
        await button.deferUpdate();
        await button.message.delete();
      }
    });

    collector.on('end', () => {
      if (mainMessage.editable) {
        prevBut.setDisabled();
        delBut.setDisabled();
        nextBut.setDisabled();
        mainMessage.edit({ components: [row] });
      }
    });
  }
};
