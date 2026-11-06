const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');
const config = require('../config');
const Database = require('../database/models/skullboard');
const { Theme } = require('../utils/embeds');
const privacy = require('../database/services/privacyService');

const processing = new Set();

module.exports = {
  name: 'messageReactionAdd',

  async execute(reaction, user) {
    const message = reaction.message;
    if (!message.guild || message.guild.id !== config.ids.guildId) return;
    if (!reaction.emoji || reaction.emoji.name !== '💀') return;
    if (processing.has(message.id)) return;

    processing.add(message.id);

    try {
      const fetched = await reaction.fetch();
      if (!privacy.canTrack(message)) return;
      if (fetched.count < 10) {
        processing.delete(message.id);
        return;
      }

      const skullboardChannel = message.guild.channels.cache.get(
        config.ids.channels.skullboard
      );
      if (!skullboardChannel) return;

      let DBENTRY = await Database.findOne({ 'originalMessage.id': message.id });
      if (!privacy.canTrack(message)) return;

      const embedData = {
        author: { name: message.author.tag, iconURL: message.author.displayAvatarURL() },
        title: `${fetched.count.toLocaleString()} :skull:`,
        description: message.content || '_ _',
        image: { url: message.attachments?.first()?.url || null },
        color: Theme.warning
      };

      const linkRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setEmoji('💀')
          .setURL(message.url)
      ]);

      if (!DBENTRY) {
        DBENTRY = new Database({
          originalMessage: { channelId: message.channel.id, id: message.id },
          user: { id: message.author.id }
        });

        const msg = await skullboardChannel.send({
          embeds: [embedData],
          components: [linkRow]
        });

        DBENTRY.skullboardMessage = { id: msg.id };
        await DBENTRY.save();
      } else {
        const existingMsg = await skullboardChannel.messages
          .fetch(DBENTRY.skullboardMessage.id)
          .catch(() => null);

        if (existingMsg && privacy.canTrack(message)) {
          await existingMsg.edit({ embeds: [embedData], components: [linkRow] });
        }
      }
    } catch (err) {
      console.error('Skullboard add error:', err);
    } finally {
      processing.delete(message.id);
    }
  }
};
