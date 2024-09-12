// const { Client } = require('discord.js');
// const database = require('../database/timed');
// const LogChannelId = '1282891329927512084';
// module.exports = {
//   name: 'tick',
//   /**
//    *
//    * @param {Client} client client
//    */
//   async execute(action, client) {
//     const expired = await database.find({
//       what: action,
//       when: {
//         $lt: new Date().getTime()
//       }
//     });

//     if (!expired.length) {
//       // no expired shits
//     } else {
//       for (const entry of expired) {
//         const {
//           data: { userId, channelId, reasons }
//         } = entry;

//         const channelsCache = client.channels.cache;
//         if (channelsCache.has(channelId)) {
//           const channel = channelsCache.get(channelId);
//           await channel.permissionOverwrites.edit(userId, {
//             ViewChannel: null
//           });

//           const loggingChannel = channelsCache.get('');
//         } else {
//           // channel does not exist
//         }
//       }
//     }
//   }
// };
