// const { Message } = require('discord.js');
// const DATABASE = require('../database/coins');
// let talkedRecently = [];
// module.exports = {
//   name: 'messageCreate',
//   /**
//    * @param {Message} message
//    * @returns
//    */
//   async execute(message) {
//     const client = message.client;
//     if (!message.author) return;
//     if (message.author.bot) return;
//     if (!message.guild) return;
//     if (message.guild.id !== '824294231447044197') return;
//     const userId = message.author.id;
//     if (talkedRecently.includes(userId)) return;

//     addUser(userId);

//     let DBUser = await DATABASE.findOne({ userId });
//     if (!DBUser) {
//       DBUser = new DATABASE({
//         userId,
//         coins: 0
//       });
//     }

//     const randomAmount = Math.ceil(Math.random() * 12) + 13;
//     DBUser.coins += randomAmount;
//     DBUser.save();
//   }
// };

// const addUser = (userId) => {
//   talkedRecently.push(userId);
//   setTimeout(() => {
//     const index = talkedRecently.indexOf(userId);
//     talkedRecently.splice(index, 1);
//   }, 60 * 1000);
// };
