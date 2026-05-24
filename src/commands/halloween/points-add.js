// const { Message, Client } = require('discord.js');
// const halloween = require('../../database/models/halloween');

// module.exports = {
//   name: 'points-add',
//   aliases: ['padd'],
//   /**
//    *
//    * @param {Message} message
//    * @param {String[]} args
//    * @param {Client} client
//    */
//   async execute(message, args, client) {
//     if (!message.member.roles.cache.has(config.roles.staff.cman)) return;

//     const team = args.shift();
//     const points = args.shift();

//     if (!team || !points) {
//       return message.reply('That is NOT how you use this command!');
//     }

//     if (isNaN(points)) {
//       return message.reply('That is NOT how you use this command!');
//     }

//     await halloween.updateOne(
//       {
//         roleId: team
//       },
//       {
//         $inc: {
//           points: parseInt(points)
//         }
//       }
//     );
//   }
// };
