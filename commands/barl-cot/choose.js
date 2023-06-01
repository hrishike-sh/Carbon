const { Message } = require('discord.js');

module.exports = {
  name: 'choose',
  category: 'Utility',
  usage: '<options>',
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    const improudofthis = /(http|https|.(png|com|mp4|mp3))/gi;
    if (improudofthis.test(message.content)) {
      return message.reply('I choose not to choose between links!');
    }
    if (message.content.includes(', ')) {
      const argarray = args.join(' ').split(', ');
      return message.reply(
        `I choose ${argarray[Math.floor(Math.random() * argarray.length)]}`
      );
    } else
      return message.reply({
        content: `I choose ${args[Math.floor(Math.random() * args.length)]}`
      });
  }
};

// aaaaaaaaaaaaaa
