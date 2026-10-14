const { readFile } = require('node:fs/promises');
const path = require('path');
const config = require('../../config');

module.exports = {
  name: 'names',

  async execute(message, args, client) {
    const target =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user ||
      (await client.users.fetch(args[0]).catch(() => null)) ||
      message.member?.user;
    if (target.id === config.ids.devUserIds[0]) return;

    const readHistory = (filename) => readFile(path.join(__dirname, '../../../lib', filename), 'utf8')
      .catch((error) => {
        if (error.code === 'ENOENT') return '{}';
        throw error;
      });
    const [rawNames, rawNicknames] = await Promise.all([
      readHistory('Fighthub names.json'), readHistory('Fighthub nicknames.json')
    ]);

    const names = JSON.parse(rawNames);
    const nicknames = JSON.parse(rawNicknames)[config.ids.guildId] || {};

    const name = names[target.id];
    const nickname = nicknames[target.id];

    if (!name && !nickname) {
      return message.reply(
        `No names or nicknames found for ${target.toString()}`
      );
    }

    const content = `${target.username}'s previous tags:\n${
        name?.past_names?.join(', ') || ''
      }\n\n${target.username}'s previous nicknames:\n${
        nickname?.past_nicks?.join(', ') || ''
      }`;
    for (let start = 0; start < content.length; start += 1900) {
      await message.reply({ content: content.slice(start, start + 1900), allowedMentions: { parse: [] } });
    }
  }
};
