const config = require('../../config');
const transcripts = require('../../database/services/mafiaTranscriptService');

module.exports = {
  name: 'mafiatranscript',
  cooldown: 3,

  async execute(message, args, client) {
    if (message.guild?.id !== config.ids.guildId ||
        message.channel.parentId !== config.ids.mafiaTranscriptCategory) {
      return message.reply('This command can only be used in the designated Mafia transcript category.');
    }
    if (args.length !== 1 || !/^\d{1,5}$/.test(args[0]) || Number(args[0]) < 1) {
      return message.reply('Use `fh mafiatranscript <number>` (for example, `fh mafiatranscript 1` or `fh mafiatranscript 00001`).');
    }
    const transcript = await transcripts.lookup(Number(args[0]), client);
    if (!transcript) return message.reply('No Mafia transcript was found for that number.');
    return message.reply({
      content: `Mafia transcript **${transcripts.formatId(transcript._id)}**: <${transcript.url}>\n**Do not share this transcript or its link ANYWHERE.**`,
      allowedMentions: { parse: [], repliedUser: false }
    });
  }
};
