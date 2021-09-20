const { inspect } = require('util')
const { MessageEmbed} = require('discord.js')
module.exports = {
    name: 'eval',
    aliases: ['e'],
    async execute(message, args, client){
    const allowedUsers = ['598918643727990784', '455576077629259787', '619339277993639956', '772524332382945292', '450864876416401419', '450864876416401419']

if(!allowedUsers.includes(message.author.id)) return
    let input = args.join(' ');
    const asynchr = input.includes('return') || input.includes('await');

    let result, evalTime;

    try {
      const before = Date.now();
      result = await eval(asynchr ? `(async()=>{${input}})();` : input) // eslint-disable-line
      evalTime = Date.now() - before;
      if (typeof result !== 'string') {
        result = inspect(result, {
          depth: +!(inspect(result, { depth: 1 }).length > 1000) // Results in either 0 or 1
        });
      }
      const tokenRegex = new RegExp(client.token, 'gi');
      result = result.replace(tokenRegex, 'the token was not found, your stupidity was.');
    } catch (err) {
      result = err.message;
    }
    
    const embed = new MessageEmbed()
        .setTitle("EVALED")
        .addField("📥 Input", `\`\`\`js\n${input}\n\`\`\``)
        .addField("📤 Output", `\`\`\`js\n${result}\`\`\``)
        .setFooter(`Evaluated in ${evalTime}ms`)

message.channel.send(embed)
    }
}