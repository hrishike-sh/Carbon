const { Message, Client } = require('discord.js');
const { readFileSync, writeFileSyn } = require('fs');
module.exports = {
  name: 'names',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0]) ||
      (await client.users.fetch(args[0]).catch(() => null)) ||
      message.member;

    const rawNames = readFileSync('../../lib/Fighthub names.json', 'utf-8');
    const rawNicknames = readFileSync(
      '../../lib/Fighthub nicknames.json',
      'utf-8'
    );

    const names = JSON.parse(rawNames);
    const nicknames = JSON.parse(rawNicknames);

    const name = names[target.id];
    const nickname = nicknames[target.id];

    if (!name && !nickname) {
      return message.reply(
        `No names or nicknames found for ${target.toString()}`
      );
    }

    message.reply(
      `${target.username}'s previous tags:\n${name.past_names.join(', ')}\n\n${
        target.username
      }'s previous nicknames:\n${nickname.past_nicks.join()}`
    );
  }
};
