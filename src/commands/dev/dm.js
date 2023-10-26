const {  EmbedBuilder } = require('discord.js');

const fh = '824294231447044197'; 
const prefix = 'fh';

module.exports = {
  name: 'dm', 
  async execute(message) {

    if(message.guild.id !== fh) {
      return message.reply("");
    }

    if(!message.member.roles.cache.has('1016728636365209631')) {
      return message.reply("Only CMs+ L bozo"); 
    }

    const user = message.mentions.users.first();
    if(!user) return message.reply("specify a user");

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const content = args.slice(1).join(" ");

    if(!content) {
      return message.reply("what's the message?");
    }

    const anonymous = args.includes('-a');

    try {

      const embed = new EmbedBuilder()
        .setDescription(content)
        .setTimestamp();

      if(!anonymous) {
        embed.setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL() 
        });
      }

      await user.send({embeds: [embed]});
      await message.reply("sent em");

    } catch(err) {
      console.error(err);
      await message.reply("unable to dm");
    }

  }

}
