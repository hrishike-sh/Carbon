// const {Database} = require('quick.replit')
// const db = new Database(process.env.REPLIT_DB_URL)

// const {Command} = require('discord.js-commando');

// module.exports = class GTNN extends Command {
//   constructor(client){
//     super(client, {
//       name: 'gtnn',
//       group: "other",
//       memberName: 'gtnn',
//       description: 'guess the number but with db',
//     });
//   }
//     run(message) {
//       if (
//             !message.member.roles.cache.some(role => role.id === '824539655134773269') &&
//             !message.member.roles.cache.some(role => role.id === '825783847622934549') &&
//             !message.member.roles.cache.some(role => role.id === '858088054942203945') &&
//             message.author.id !== '598918643727990784'
//         ) {
//             return message.channel.send('You must have one of the following roles to register this command: \`Moderator\`, \`Giveaway Manager\` or \`Event Manager\`')
//         }
//       const prefix = 'fh gtnn'
//       const args = message.content.slice(prefix.length).split("/")
//       const number = Math.floor(Math.random() * parseInt(args[0]))
//     if(!number){
//       return message.reply(`What should be the number?`)
//     } else if(args[0].toLowerCase() === 'end'){
//        db.delete('gtn').then(() => {
//          message.reply('I have done something.')
//       })
//       return;
//     }
//     args.shift()
//     let channelID = args[0]
//     if(!channelID){
//       return message.reply(`Please provide the channel id as the next argument!`)
//     }

//     const info = {
//       tbg: number,
//       channel: channelID
//     }
//     db.set('gtn', info).then(() => {
//       message.member.send(`Number: ^^${number}^^\nChannel: <#${channelID}>(${channelID})`)
//       message.reply(`The gtn event has been started!`)
//     })
    
//     }
// }

