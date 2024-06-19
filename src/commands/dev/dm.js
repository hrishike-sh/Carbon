const { EmbedBuilder, Message, Client } = require('discord.js');
const fh = '824294231447044197';
const prefix = 'fh';

module.exports = {
  name: 'dm',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   * @returns
   */
  async execute(message, args, client) {
    if (message.guild.id !== fh) {
      return message.reply('');
    }
    if (!message.member.roles.cache.has('1016728636365209631')) {
      return message.reply('Only CMs+ L bozo');
    }

    const user =
      message.mentions.users?.first() ||
      (await client.users.fetch(args[0]).catch(() => null)) ||
      null;
    if (!user) return message.reply('Please mention a user');

    args.shift();
    let content = args.join(' ');
    let an = false;
    if (content.includes('-a')) {
      content = content.replace('-a', '');
      an = true;
    }
    const embed = new EmbedBuilder()
      .setTitle('You have received a message from FightHub Staff!')
      .setDescription('Message: ' + content)
      .setTimestamp();
    if (!an) {
      embed.setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL()
      });
    }

    try {
      (await user.createDM()).send({
        embeds: [embed]
      });
      message.react('✅');
    } catch (error) {
      message.reply('Error: ' + error);
    }
  }
};
