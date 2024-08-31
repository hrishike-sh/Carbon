// const { Message, Client } = require('discord.js');
// const Database = require('../../database/coins');
// let cd = [];
// module.exports = {
//   name: 'coinflip',
//   aliases: ['cf'],
//   description: 'Flip a coin!',
//   cooldown: 3,
//   /**
//    *
//    * @param {Message} message
//    * @param {String[]} args
//    * @param {Client} client
//    */
//   async execute(message, args, client) {
//     const userId = message.author.id;
//     if (!(await client.antiBot(message))) return;
//     let databaseEntry = await Database.findOne({ userId });
//     const amount = parseAmount(args[0]) || 1000;

//     if (!databaseEntry) {
//       databaseEntry = new Database({
//         userId,
//         coins: 0
//       });
//     }

//     if (databaseEntry.coins < amount) {
//       return await message.reply({
//         content: 'You do not have that many coins!'
//       });
//     }
//     if (amount > 10_000) {
//       return await message.reply({
//         content: 'You can flip a max of 10,000 coins.'
//       });
//     }

//     if (cd.includes(message.author.id)) {
//       return await message.reply({
//         content: 'You can only use this command once every 5 seconds!'
//       });
//     }
//     addCd(userId);

//     const result = Math.floor(Math.random() * 2);
//     if (result == 0) {
//       databaseEntry.coins += amount;
//       await databaseEntry.save();

//       return await message.reply({
//         embeds: [
//           {
//             title: 'Coinflip',
//             color: 0x00ff00,
//             description: `You won ${amount} <:token:1003272629286883450>!`,
//             author: {
//               name: message.author.tag,
//               icon_url: message.author.displayAvatarURL()
//             }
//           }
//         ]
//       });
//     } else {
//       databaseEntry.coins -= amount;
//       await databaseEntry.save();

//       return await message.reply({
//         embeds: [
//           {
//             title: 'Coinflip',
//             color: 0xff0000,
//             description: `You lost ${amount} <:token:1003272629286883450>!`,
//             author: {
//               name: message.author.tag,
//               icon_url: message.author.displayAvatarURL()
//             }
//           }
//         ]
//       });
//     }
//   }
// };

// const parseAmount = (string) => {
//   // Checks if first digit is valid number
//   if (isNaN(string[0])) return null;

//   // Return if number is like "5e4" etc.
//   if (!isNaN(Number(string))) return Number(string);

//   // Check for "m", "k" etc. and return value
//   if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
//     return null;

//   // Add values of m, k and b
//   const val = string[string.length - 1];
//   const rawString = string.replace(string[string.length - 1], '');
//   const calculated = parseInt(rawString) * StringValues[val];

//   // Invalid number
//   if (isNaN(calculated)) return null;
//   else return calculated;
// };

// const StringValues = {
//   m: 1e6,
//   k: 1e3,
//   b: 1e9
// };
// const addCd = async (userId) => {
//   cd.push(userId);
//   await sleep(5_000);
//   cd = cd.filter((a) => a != userId);
// };

// const sleep = (milliseconds) => {
//   return new Promise((resolve) => setTimeout(resolve, milliseconds));
// };
