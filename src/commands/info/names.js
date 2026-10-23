const { readFileSync } = require('fs');
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

    const rawNames = readFileSync(
      path.join(__dirname, '../../../lib/Fighthub names.json'),
      'utf-8'
    );
    const rawNicknames = readFileSync(
      path.join(__dirname, '../../../lib/Fighthub nicknames.json'),
      'utf-8'
    );

    const names = JSON.parse(rawNames);
    const nicknames = JSON.parse(rawNicknames)[config.ids.guildId];

    const name = names[target.id];
    const nickname = nicknames[target.id];

    if (!name && !nickname) {
      return message.reply(
        `No names or nicknames found for ${target.toString()}`
      );
    }

    message.reply(
      `${target.username}'s previous tags:\n${
        name?.past_names?.join(', ') || ''
      }\n\n${target.username}'s previous nicknames:\n${
        nickname?.past_nicks?.join(', ') || ''
      }`
    );
  }
};
