const { EmbedBuilder } = require('discord.js');
const fh = '824294231447044197';
const prefix = 'fh';

module.exports = {
  name: 'dm',
  async execute(message) {
    if(message.guild.id !== fh || !message.member.roles.cache.has('1016728636365209631')) {
      return message.reply("No permission");
    }

    const user = message.mentions.users.first();
    if(!user) return message.reply("specify a user");

    const content = message.content
      .slice(prefix.length + 3) 
      .replace(`<@${user.id}>`, '')
      .replace(`<@!${user.id}>`, '')
      .replace('-a', '')
      .trim();

    if(!content) return message.reply("what's the message?");

    const anonymous = message.content.includes('-a');

    try {
      const embed = new EmbedBuilder()
        .setDescription(content)
        .setTimestamp()
        .setAuthor(anonymous ? null : {
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        });

      await user.send({embeds: [embed]});
      await message.reply("sent em");
    } catch(err) {
      await message.reply("unable to dm");
    }
  }
}
