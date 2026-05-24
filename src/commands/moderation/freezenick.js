const { Message } = require('discord.js');
const DB = require('../../database/models/freezenick');
const config = require('../../config');

module.exports = {
  name: 'freezenick',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.mod,
        config.roles.staff.admin
      )
    ) {
      return message.reply('You cannot run this command!');
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply(`ping the user retard`);

    args.shift();

    const name = args.join(' ')?.slice(0, 32) || null;
    if (!name)
      return message.reply('run the command again and provide a name retard');

    await user.setNickname(name);

    message.reply(
      `Successfully froze ${user.user.tag}'s nickname to **${name}**`
    );

    await DB.findOneAndUpdate(
      { userId: user.id },
      { $set: { name } },
      { upsert: true }
    );
  }
};
