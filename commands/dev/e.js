const {Command} = require('discord.js-commando');
const Discord = require('discord.js')
const {inspect} = require('util')
const client = new Discord.Client()
module.exports = class UtilCommand extends Command {
  constructor(client){
    super(client, {
      name: 'e',
      aliases: ['evaluate'],
      group: "other",
      memberName: 'eval',
      description: 'Evaluate code from discord!',
    });
  }
    run(message) {
    const allowedUser = ['598918643727990784', '455576077629259787', '619339277993639956', '772524332382945292']
    const {member, content} = message
  if(!allowedUser.includes(message.author.id)) return;
  const code = message.content.replace(`fh e `, '')
  try {
      let evaled = eval(code)

      var embed = new Discord.MessageEmbed()
      .setColor(0xfcfcfc)
      .setTitle("Evaluated")
      .addField("📥 Input", `\`\`\`${code}\`\`\``) 
      .addField("📤 Output", `\`\`\`js\n${inspect(evaled, { depth: 0 })}\`\`\``)
      .addField("Type", `\`\`\`${typeof(evaled)}\`\`\``)
      .setTimestamp()
      .setFooter(`Evaluated in ${client.ws.ping}ms`)
      message.channel.send(embed)

      } catch (error) {
        var embed = new Discord.MessageEmbed()
        .setColor(0xd62424)
        .setTitle("❌ Error")
        .setDescription(`${error}`)
        message.channel.send(embed)
      }
    }
}
client.login(process.env.token)