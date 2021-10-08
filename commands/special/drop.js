
const deez = require('../../database/models/candies')
let cooldown = []
module.exports = {
    name: 'drop',
    disabledChannels: ['870240187198885888'],
    async execute(message, args){
        const user = await deez.findOne({ userId: message.author.id })
        let candDrop;
        if(!user){
            candDrop = 0
        } else candDrop = user.candies

        if(candDrop === 0) return message.channel.send("You cannot drop any candies as you have 0 of them.")

        let willDrop;
        await message.channel.send(`${message.member} you have a total of **${candDrop.toLocaleString()}** candies, how many do you want to drop?`)
        const collector = message.channel.createMessageCollector(m => message.author.id === m.author.id, { max: 1 })
        const peopleWhoEntered = []
        collector.on('collect', async msg => {
            if(isNaN(parseInt(msg.content))) return message.channel.send("You have to give a valid number.")
            const willDrop = parseInt(msg.content)

            if(willDrop > candDrop) return message.channel.send(`You do not have ${willDrop} candies.`)
            if(willDrop <= 1000) return message.channel.send("You cant drop less than 1000 candies")
            user.candies -= willDrop
            user.save()

            cooldown.push(message.channel.id)
            const canType = [
                'trick or treats',
                'steal',
                'MINE',
                'yoink',
                'can i have some'
            ]
                const toType = canType[Math.floor(Math.random() * canType.length)]
                const mainMessage = await message.channel.send(`:ghost: **Halloween Drop** :ghost:\n\nEvery user that types **\`${toType}\`** in 30 seconds gets a reward!`)
                const peopleWhoEntered = []
                const collector = message.channel.createMessageCollector(m => m.content.toLowerCase() === toType.toLowerCase(), { time: 30000 })
        
                  collector.on('collect', async msg => {
                      if(peopleWhoEntered.includes(msg.author.id)) return;
                    peopleWhoEntered.push(msg.author.id)
                    message.channel.send(`:tada: **${msg.author.username}** collected the drop!`)
                  })
                  collector.on('end', async () => {
                      const payouts = (willDrop / peopleWhoEntered.length).toFixed(0)
                    message.channel.send(`:no_entry: The drop has ended! A total of ${peopleWhoEntered.length} users collected the drop and got **${payouts.toLocaleString()}** candies each!!\nType \`fh candy\` in <#824312952752570368> to check how many candies you have!`)
                    peopleWhoEntered.forEach(async value => {
                        let user = await deez.findOne({ userId: value })
                        if(!user){
                           user = new deez({
                                userId: value,
                                candies: 0
                            })
                        }
                        user.candies += parseInt(payouts)
                        user.save()
                    })
                    setTimeout(() => {
                        cooldown = cooldown.filter(e => e !== message.channel.id)
                        console.log(cooldown)
                    }, 60 * 1000)
                  })
        })
    }
}