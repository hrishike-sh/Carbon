const { MessageEmbed } = require('discord.js');

const fh = '824294231447044197';

module.exports = {
  name: 'dm',

  async execute(message) {

    if(message.guild.id !== fh) {
      return message.reply("you can't run this command");
    }

    console.log(`DM command triggered by ${message.author.tag} in #${message.channel.name}`);

    if(!message.member.roles.cache.has('1016728636365209631')) {
      return message.reply("Only CMs+ L bozo");
    }

    const user = message.mentions.users.first();
    if(!user) return message.reply("specify a user");

    console.log(`DMing user: ${user.tag}`);

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const content = args.slice(1).join(" ");

    if(!content) {
      return message.reply("what's the message?");
    }

    console.log(`DM content: ${content}`);

    const anonymous = args.includes('-a');

    try {

      const embed = new MessageEmbed()
        .setDescription(`Message: ${content}`)
        .setTimestamp();

      if(!anonymous) {
        embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      }

      console.log('Attempting to send DM...');
      
      await user.send({ content: `You have a new message!`, embeds: [embed] });

      console.log('DM sent!');

      await message.reply("sent em");

    } catch(err) {
      console.log('Error sending DM:');
      console.error(err);
      await message.reply("unable to dm");
    }
    const emoji = message.guild.emojis.cache.get('1167089368775802940');

    if (emoji) {

   await message.react(emoji);

  } else {

  console.log('error reacting');

}

  }

}
