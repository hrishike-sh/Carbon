const {Command} = require('discord.js-commando');
const Messages = require('../../functions/heist-dono');

module.exports = class DonoCommand extends Command {
  constructor(client){
    super(client, {
      name: 'h',
      group: "donations",
      memberName: 'hdono',
      description: 'Donation command to check your donations etc.',
    });
  }
    async run(message) {
      const prefix = 'fh h '
      const args = message.content.slice(prefix.length).split(/ +/g);
      const example = `\n\nExample: \`fh h 598918643727990784 add 5e6\` | \`fh h 598918643727990784 remove 5e6\``
     if (
            !message.member.roles.cache.some(role => role.id === '824539655134773269') &&
            !message.member.roles.cache.some(role => role.id === '825783847622934549') &&
            !message.member.roles.cache.some(role => role.id === '858088054942203945') &&
            message.author.id !== '598918643727990784'
        ) {
            return message.channel.send('You must have one of the following roles to register this command: \`Moderator\`, \`Giveaway Manager\` or \`Event Manager\`')
        }
     if(!args[0]) return message.channel.send("You must either ping someone or you must give their id" + example)
     const mentionID = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
     args.shift()

     const firstArg = args[0]
     if(!firstArg) return message.channel.send("You must tell me what to do" + example)

     if(firstArg !== 'add' && firstArg !== 'subtract' && firstArg !== 'remove' && firstArg !== '-' && firstArg !== '+' && firstArg !== 'item'){
       return message.channel.send("Invalid response" + example)
     }
      if(firstArg === 'add' || firstArg === '+'){
        let finalNum = 0;
        args.shift()
        if(!args[0]) return message.channel.send("You must provide a number!" + example)
        let number = args[0]
        if(isNaN(parseInt(number[0][0]))){
          return message.channel.send("Invalid number provided" + example)
        } else {
          if(number.endsWith('k')){
            number.replace('k', '')
            finalNum = parseInt(number) * 1e3
          } else if (number.endsWith('m')){
            number.replace('m', '')
            finalNum = parseInt(number) * 1e6
          } else if (number.endsWith('b')){
            number.replace('b', '')
            finalNum = parseInt(number) * 1e9
          } else if (number.includes('e')){
            finalNum = eval(number)
          } else {
            finalNum = number
          }
        }
        Messages.addHeistDono(mentionID, message.guild.id, finalNum)
        message.channel.send(`Added **${finalNum.toLocaleString()}** coins to <@${mentionID}>(${mentionID})'s profile!`)
      } else if (firstArg === 'subtract' || firstArg === 'remove' || firstArg === '-'){
        let finalNum = 0
        args.shift()
        if(!args[0]) return message.channel.send("You must provide a number!" + example)
        let number = args[0]
        if(isNaN(parseInt(number[0][0]))){
          return message.channel.send("Invalid number provided" + example)
        } else {
          if(number.endsWith('k')){
            number.replace('k', '')
            finalNum = parseInt(number) * 1e3
          } else if (number.endsWith('m')){
            number.replace('m', '')
            finalNum = parseInt(number) * 1e6
          } else if (number.endsWith('b')){
            number.replace('b', '')
            finalNum = parseInt(number) * 1e9
          } else if (number.includes('e')){
            finalNum = eval(number)
          } else {
            finalNum = number
          }
        }
        Messages.removeHeistDono(mentionID, message.guild.id, finalNum)
        message.channel.send(`Removed **${finalNum.toLocaleString()}** coins from <@${mentionID}>(${mentionID})'s profile!`)
      } else;
     
     
    }
}

const itemValues = {
  rarepepe: 50000,
  banknote: 80000,
  pizza: 200000,
  pepecoin: 350000,
  pepemedal: 6000000,
  pepecrown: 250000000,
  pepetrophy: 32000000,
  cookie: 2000,
  snow: 2000,
  santashat: 50000,
  toe: 50000,
  foolsnotif: 50000,
  pepestatue: 1000000,
  reversalcard: 3000000,
  jacky: 7500000,
  multi: 13000000,
  lotto: 100000000,
  flower: 100000000,
  beard: 150000000,
  boltcutters: 250000000,
  fakeid: 800,
  sand: 2000,
  laptop: 2000,
  padlock: 2000,
  apple: 3000,
  landmine: 5000,
  alcohol: 5000,
  coinbomb: 8000,
  fishingpole: 10000,
  fidgetspinner: 10000,
  huntingrifle: 10000,
  life: 10000,
  tidepod: 10000,
  horseshoe: 15000,
  wishlist: 15000,
  cheese: 30000,
  normiebox: 50000,
  memebox: 100000,
  dankbox: 150000,
  dailybox: 150000,
  giftbox: 500000,
  godbox: 8000000,
  banhammer: 2000000,
  collar: 10000000,
  ectoplasm: 10000000,
  tipjar: 15000000,
  taco: 20000000,
  stonkmachine: 15000000,
  santasbag: 50000000,
  phone: 1000,
  bread: 15000,
  ant: 50000,
  shovel: 20000,
  trash: 25000,
  chill: 20000,
  golden: 375000,
  skunk: 8500,
  stickbug: 80000,
  rarefish: 20000,
  legendaryfish: 100000,
  candy: 25000,
  deer: 20000,
  duck: 13000,
  exoticfish: 80000,
  commonfish: 3000,
  jellyfish: 55000,
  ladybug: 80000,
  junk: 7500,
}