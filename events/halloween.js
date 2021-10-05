let cooldown = []
const candeez = require('../database/models/candies')
module.exports = {
    name: 'message',
    async execute(message, client){
       if(message.channel.id !== '870240187198885888') return;
       const drop = Math.floor(Math.random() * 10) === 5 ? true : false
       const randomAmount = Math.floor(Math.random() * 2500)
       const canType = [
           'trick or treats',
           'steal',
           'MINE',
           'yoink',
           'can i have some'
       ]

       if(!cooldown.includes(message.channel.id) && drop){
        cooldown.push(message.channel.id)
        const toType = canType[Math.floor(Math.random() * canType.length)]
        const mainMessage = await message.channel.send(`:ghost: **Halloween Drop** :ghost:\n\nEvery user that types **\`${toType}\`** in 30 seconds gets a reward!`)
        const peopleWhoEntered = []
        const collector = message.channel.createMessageCollector(m => m.content.toLowerCase() === toType.toLowerCase(), { time: 30000 })

          collector.on('collect', async msg => {
              if(peopleWhoEntered.includes(msg.author.id)) return;
            peopleWhoEntered.push(msg.author.id)
            message.channel.send(`:tada: **${msg.member.displayName}** collected **${randomAmount.toLocaleString()}** candeez!`)
          })
          collector.on('end', async () => {
            message.channel.send(`:no_entry: The drop has ended! A total of ${peopleWhoEntered.length} users completed the event!`)
            peopleWhoEntered.forEach(async value => {
              console.log(value)
                let user = await candeez.findOne({ userId: value })
                if(!user){
                   user = new candeez({
                        userId: value,
                        candies: 0
                    })
                }
                user.candies += randomAmount
                user.save()
            })
            setTimeout(() => {
                cooldown = cooldown.filter(e => e !== message.channel.id)
                console.log(cooldown)
            }, 60 * 1000)
          })
          
       }
    }
}