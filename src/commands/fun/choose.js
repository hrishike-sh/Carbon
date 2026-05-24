const { warningEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'choose',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const clean = args.join(' ');
    const choices = clean.includes(',') ? clean.split(',') : clean.split(' ');
    const choice = choices[Math.floor(Math.random() * choices.length)];

    message.reply({
      embeds: [
        warningEmbed({
          author: {
            name: message.author.username,
            iconURL: message.author.displayAvatarURL()
          },
          description: `You chose ${choice}`
        })
      ]
    });
  }
};
