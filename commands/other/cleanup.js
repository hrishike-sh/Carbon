// const {
//     Command
// } = require('discord.js-commando');

// module.exports = class CUCommand extends Command {
//     constructor(client) {
//         super(client, {
//             name: 'cleanup',
//             aliases: ['cu'],
//             group: "other",
//             memberName: 'cleanup',
//             description: 'Cleans up messages',
//         });
//     }
//    async run(message) {
//         const prefix = 'fh '
//         const args = message.content.slice(prefix.length).split(/ +/g);
// //!message.member.roles.cache.some(role => role.id !== '824539655134773269') || 
//         args.shift()
//         // if (
//         //     message.author.id !== '598918643727990784'
//         // ) {
//         //     return;
//         // }
//         const messages = await message.channel.messages.fetch()
//         const botMessages = messages.filter(msg => {
//             const isCommand = msg.content.startsWith("fh ")

//             return msg.author.bot || isCommand;
//         })
//         if (botMessages.length > 1) {
//             message.channel.bulkDelete(botMessages);
//         } else if (botMessages.length) {
//             botMessages[0].delete();
//         } else {
//             return;
//         }
//         message.channel.send("Cleaned up bot messages.").then(async a => {
//             await sleep(2500)
//             a.delete()
//         })
//     }
// }


// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms))
// }