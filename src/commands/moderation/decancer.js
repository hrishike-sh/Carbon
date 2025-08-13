const decancer = require('decancer');
const { Message, Client } = require('discord.js');

module.exports = {
  name: 'decancer',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */ async execute(message, args) {
    if (!message.member.roles.cache.has('824539655134773269')) return;

    const target = message.mentions.members?.first() || null;
    if (!target) return message.reply('You have to mention someone!');

    const cured = decancer(target.displayName).toString();

    target.setNickname(cured);

    message.reply(`Their name was changed to ${cured}`);
  }
};
