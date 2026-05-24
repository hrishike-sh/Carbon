const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const config = require('../config');
const Database = require('../database/models/skullboard');

module.exports = {
  name: 'messageReactionRemove',

  async execute(reaction, user) {
    const message = reaction.message;
    if (!message.guild || message.guild.id !== config.ids.guildId) return;
    if (!reaction.emoji || reaction.emoji.name !== '💀') return;

    const fetched = await reaction.fetch();
    const DBENTRY = await Database.findOne({ 'originalMessage.id': message.id });
    if (!DBENTRY) return;

    const skullboardChannel = message.guild.channels.cache.get(config.ids.channels.skullboard);
    if (!skullboardChannel) return;

    const embedData = {
      author: { name: message.author.tag, iconURL: message.author.displayAvatarURL() },
      title: `${fetched.count.toLocaleString()} :skull:`,
      description: message.content || '_ _',
      image: { url: message.attachments?.first()?.url || null },
      color: Colors.Gold
    };

    const linkRow = new ActionRowBuilder().addComponents([
      new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji('💀').setURL(message.url)
    ]);

    if (fetched.count >= 10) {
      const existingMsg = await skullboardChannel.messages
        .fetch(DBENTRY.skullboardMessage.id)
        .catch(() => null);
      if (existingMsg) {
        await existingMsg.edit({ embeds: [embedData], components: [linkRow] });
      }
    } else {
      const existingMsg = await skullboardChannel.messages
        .fetch(DBENTRY.skullboardMessage.id)
        .catch(() => null);
      if (existingMsg) {
        await existingMsg.delete().catch(() => {});
      }
      await DBENTRY.deleteOne();
    }
  }
};
