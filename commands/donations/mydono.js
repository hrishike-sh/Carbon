const {Command} = require('discord.js-commando');
const Messages = require('discord-messages');
const Heists = require('../../functions/heist-dono');
const { MessageEmbed } = require('discord.js')
module.exports = class MyDono extends Command {
  constructor(client){
    super(client, {
      name: 'mydono',
      aliases: ['myd'],
      group: "donations",
      memberName: 'mydono',
      description: 'Check how many donations you / some person has done!',
    });
  }
    async run(message) {
      let target = message.mentions.users.first() || message.author
      const mainMessage = await message.channel.send({ embed: {description: "Fetching database..."}})
      let user = await Messages.fetch(target.id, message.guild.id, true);
      let user2 = await Heists.fetch(target.id, message.guild.id, true);
      
      if(!user && !user2) return message.reply('Either the target has not donated any amount OR your donations are yet to be counted!')
      const embed = new MessageEmbed()
        .setTitle("Donations")
        .setDescription(`Donation info for the user ${target}!`)
        .setThumbnail("https://cdn.discordapp.com/emojis/862774540895125584.png?v=1")
        .addFields([
          {
            name: 'Donated amount (Donations)',
            value: `> ${user.data.messages.toLocaleString()}`,
            inline: true
          },
          {
            name: "Leaderboard position (Donations)",
            value: `> ${user.position}`,
          },
          {
            name: "Donated amount (Heists)",
            value: `> ${!user2 ? "None" : user2.data.amount.toLocaleString()}`,
            inline: true
          },
          {
            name: "Leadrboard position (Heists)",
            value: `> ${user2 ? user2.position : "None"}`,
          }
        ])
        .setTimestamp()
        .setFooter("Thanks for donating!")
        .setColor("RANDOM")

      mainMessage.edit(embed)
    }
}