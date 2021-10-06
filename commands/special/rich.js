
const deez = require('../../database/models/candies')

module.exports = {
    name: 'rich',
    async execute(message, args, client){
        const rawLb = await deez.find({}).sort({ candies: -1 }).limit(10)
        const a = [
          '👑',
          '🥈',
          '🥉',
        ]
        const finalLb = rawLb.map(value => `${a[rawLb.indexOf(value)] || ':poop:'} - <@${rawLb[rawLb.indexOf(value)].userId}> with **${rawLb[rawLb.indexOf(value)].candies.toLocaleString()}** candeez`).join('\n')
        message.channel.send({ embed: {
          title: "Candeez Leaderboard :ghost:",
          description: finalLb,
          footer: {
            text: 'imagine not being on here'
          }
        } })
        
    } // 
}