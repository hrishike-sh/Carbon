const {Command} = require('discord.js-commando');
const Messages = require('discord-messages');
const Discord = require('discord.js');
const Heists = require('../../functions/heist-dono')
const client = new Discord.Client()
module.exports = class LBCommand extends Command {
  constructor(client){
    super(client, {
      name: 'lb',
      group: "donations",
      memberName: 'lb',
      description: 'Check the people who have donated the most!',
    });
  }
    async run(message) {
      const prefix = 'fh lb '
      const args = message.content.slice(prefix.length).split(/ +/g)
      if(!args[0]) return message.channel.send("Which leaderboard would you like to see?\n\nExample: \`fh lb h\`, \`fh lb d\`")
    
      if(args[0] === 'd'){
      const rawLB = await Messages.fetchLeaderboard(message.guild.id, 10)
      if(rawLB.length < 1) return message.channel.send('Nobody has done any donations yet... or they are not counted yet.')

      const leaderboard = await Messages.computeLeaderboard(client, rawLB, true)

      const lb = leaderboard.map(e => `${e.position}. ${e.username}#${e.discriminator}\nDonated coins: **${e.messages.toLocaleString()}**`)

      message.channel.send(`**__LEADERBOARD__**\n\n${lb.join('\n\n')}`)
      } else if (args[0] === 'h'){
        const rawLB = await Heists.fetchLeaderboard(message.guild.id, 10)
      if(rawLB.length < 1) return message.channel.send('Nobody has done any donations yet... or they are not counted yet.')
      const leaderboard = await Heists.computeLeaderboard(client, rawLB, true)
      const lb = leaderboard.map(e => `${e.position}. ${e.username}#${e.discriminator}\nDonated coins: **${e.amount.toLocaleString()}**`)

      message.channel.send(`**__LEADERBOARD__**\n\n${lb.join('\n\n')}`)
      }
    }
}
client.login(process.env.token)