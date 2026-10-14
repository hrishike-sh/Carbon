const { inspect } = require('node:util');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

function redactSecrets(value) {
  let text = String(value);
  const secrets = Object.entries(process.env)
    .filter(([key, secret]) => secret && /token|secret|password|api_?key|mongopath|database_url|score_api/i.test(key))
    .map(([, secret]) => secret)
    .sort((a, b) => b.length - a.length);
  for (const secret of secrets) text = text.split(secret).join('[REDACTED]');
  return text;
}

module.exports = {
  name: 'eval',
  aliases: ['e'],
  category: 'Developer',
  description: 'Run developer code.',
  async execute(message, args, client) {
    if (!config.ids.devUserIds.includes(message.author.id)) return;
    const input = args.join(' ').replace(/^```(?:js)?\s*\n?/i, '').replace(/```$/, '').trim();
    if (!input) return message.reply('Provide JavaScript to evaluate.');

    let result;
    try {
      result = await eval(input.includes('await') ? `(async()=>{${input}})();` : input);
      if (typeof result !== 'string') result = inspect(result, { depth: 1 });
    } catch (error) {
      result = error.message;
    }

    const safeInput = redactSecrets(input);
    const safeResult = redactSecrets(result);
    const codeField = (text) => `\`\`\`js\n${text.replace(/```/g, '`\u200b``').slice(0, 1000)}\n\`\`\``;
    const embed = new EmbedBuilder().setTitle('EVALED').addFields(
      { name: '📥 Input', value: codeField(safeInput) },
      { name: '📤 Output', value: codeField(safeResult) }
    );
    const payload = {
      embeds: [embed],
      allowedMentions: { parse: [] },
      files: safeResult.length > 1000
        ? [new AttachmentBuilder(Buffer.from(safeResult.slice(0, 1_000_000)), { name: 'eval-result.txt' })]
        : []
    };

    await message.channel.send(payload);
    const logChannel = client.channels.cache.get('897100501148127272');
    if (logChannel?.isSendable()) {
      await logChannel.send({
        ...payload,
        content: `${message.author.tag} (\`${message.author.id}\`) ran the eval command!`
      }).catch(() => {});
    }
  }
};
