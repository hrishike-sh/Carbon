const config = require('../../config');
const transcripts = require('../../database/services/mafiaTranscriptService');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { infoEmbed, warningEmbed } = require('../../utils/embeds');

function replyNotice(message, description) {
  return message.reply({
    embeds: [warningEmbed({ title: 'Mafia archive', description, footer: 'Mafia transcripts' })],
    allowedMentions: { parse: [], repliedUser: false }
  });
}

module.exports = {
  name: 'mafiatranscript',
  cooldown: 3,

  async execute(message, args, client) {
    if (message.guild?.id !== config.ids.guildId ||
        message.channel.parentId !== config.ids.mafiaTranscriptCategory) {
      return replyNotice(message, 'This command can only be used in the designated Mafia transcript category.');
    }
    if (args.length !== 1 || !/^\d{1,5}$/.test(args[0]) || Number(args[0]) < 1) {
      return replyNotice(message, 'Use `fh mafiatranscript <number>` (for example, `fh mafiatranscript 1` or `fh mafiatranscript 00001`).');
    }
    const transcript = await transcripts.lookup(Number(args[0]), client);
    if (!transcript) return replyNotice(message, 'No Mafia transcript was found for that number.');
    const id = transcripts.formatId(transcript._id);
    const embed = infoEmbed({
      title: `📁 Mafia transcript #${id}`,
      description: 'The game record is ready. Use the button below to open the transcript.',
      fields: [
        { name: 'Game ID', value: `\`${id}\``, inline: true },
        { name: '🔒 Private transcript', value: '**Do not share this transcript or its link ANYWHERE.**' }
      ],
      footer: 'Mafia archive • Restricted access'
    });
    const recordedAt = new Date(transcript.recordedAt).getTime();
    if (Number.isFinite(recordedAt)) {
      embed.spliceFields(1, 0, {
        name: 'Recorded', value: `<t:${Math.floor(recordedAt / 1000)}:f>`, inline: true
      });
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('View transcript')
        .setEmoji('📄').setURL(transcript.url)
    );
    return message.reply({
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: [], repliedUser: false }
    });
  }
};
