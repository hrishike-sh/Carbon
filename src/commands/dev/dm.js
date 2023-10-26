const { MessageEmbed } = require('discord.js');

const fh = '824294231447044197'; 

module.exports = {
  name: 'dm', 
  description: 'DM a user',
  async execute(message) {

    if(message.guild.id !== fh) {
      return message.reply("you can't run this command");
    }

    if(!message.member.roles.cache.has('1016728636365209631')) {
      return message.reply("Only cms+ L bozo");
    }

    const user = message.mentions.users.first();
    if(!user) return message.reply("specify a user");

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const content = args.slice(1).join(" ");
    if(!content) return message.reply("what's the message?");

    const anonymous = args.includes('-a');

    const embed = new MessageEmbed()
      .setDescription(`Message: ${content}`)
      .setTimestamp();

    if(!anonymous) {
      embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    }

    try {
      await user.send({ embeds: [embed] });
      await message.reply("sent em"); 
    } catch(err) {
      message.reply("unable to dm");
    }

  }
}
