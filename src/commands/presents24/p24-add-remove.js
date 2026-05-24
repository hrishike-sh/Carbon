// const { Message, Client } = require('discord.js');
// const Database = require('../../database/models/presents-dec-24');
// module.exports = {
//   name: 'padd',
//   /**
//    *
//    * @param {Message} message
//    * @param {String[]} args
//    * @param {Client} client
//    */
//   async execute(message, args, client) {
//     const mod = config.roles.staff.mod;

//     if (!message.member.roles.cache.has(mod)) return;

//     const user =
//       message.mentions.members.first() ||
//       message.guild.members.cache.get(args[0]);
//     if (!user) return message.reply('Please mention a user!');

//     const amount = args[1];
//     if (!amount) return message.reply('Please specify an amount!');
//     if (isNaN(Number(amount))) {
//       return message.reply('Please specify a valid amount!');
//     }

//     const res = await Database.findOneAndUpdate(
//       {
//         userId: user.id
//       },
//       {
//         $inc: {
//           amount: Number(amount)
//         }
//       },
//       {
//         upsert: true,
//         new: true
//       }
//     );

//     return message.reply(
//       `Successfully ${Number(amount) > 0 ? 'added' : 'removed'} ${Number(
//         amount
//       ).toLocaleString()} presents ${Number(amount) > 0 ? 'to' : 'from'} <@${
//         user.id
//       }>! Total: ${res.amount}`
//     );
//   }
// };
