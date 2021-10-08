let cooldown = []
const candeez = require('../database/models/candies')
const settings = require('../database/models/settingsSchema')
module.exports = {
    name: 'message',
    async execute(message, client){
      if(!message.guild) return
       if(message.guild.id !== '824294231447044197') return;
       if(message.author.bot) return;
       const channelSettings = await settings.findOne({ guildID: message.guild.id })
       if(channelSettings.disabledDrop && channelSettings.disabledDrop.includes(message.channel.id)) return;
       const drop = Math.floor(Math.random() * 100) === 5 ? true : false
       const randomAmount = Math.floor(Math.random() * 2500)
       const canType = [
           'trick or treats',
           'steal',
           'MINE',
           'yoink',
           'can i have some'
       ]
       const types = ['scramble', 'spam', 'scramble']
       const type = types[Math.floor(Math.random() * types.length)]
       if(!cooldown.includes(message.channel.id) && drop){
        if(type === 'spam'){
          cooldown.push(message.channel.id)
        const toType = canType[Math.floor(Math.random() * canType.length)]
        const mainMessage = await message.channel.send(`:ghost: **Halloween Drop** :ghost:\n\nEvery user that types **\`${toType}\`** in 30 seconds gets a reward!`)
        const peopleWhoEntered = []
        const collector = message.channel.createMessageCollector(m => m.content.toLowerCase() === toType.toLowerCase(), { time: 30000 })

          collector.on('collect', async msg => {
              if(peopleWhoEntered.includes(msg.author.id)) return;
            peopleWhoEntered.push(msg.author.id)
            message.channel.send(`:tada: **${msg.author.username}** collected **${randomAmount.toLocaleString()}** candies!`)
          })
          collector.on('end', async () => {
            message.channel.send(`:no_entry: The drop has ended! A total of ${peopleWhoEntered.length} users completed the event!\nType \`fh candy\` in <#824312952752570368> to check how many candies you have!`)
            peopleWhoEntered.forEach(async value => {
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
            }, 60 * 1000)
          })
        } else if (type === 'scramble'){
          cooldown.push(message.channel.id)
          const words = [
            'snack',
            'tee',
            'strafe',
            'mikoto',
            'hrish',
            'apt',
            'appel',
            'tobokola',
            'zombie',
            'dark',
            'venom',
            'orion',
            'memertsu',
            'sunny',
            'yassin',
            'ina',
            'ace',
            'hemly',
            'xan',
            'mirror',
            'naomi',
            'rk',
            'psalm',
            'luz',
            'bread',
            'skybye',
            'xyz',
            'thunder',
            'lyra',
            'deep',
            'ayyy',
          ]
          const randomWord = words[Math.floor(Math.random() * words.length)]
          const toGuess = getRandom(randomWord)
          const randomAmount = Math.floor(Math.random() * 2500) + 7500
          await message.channel.send(`:ghost: Halloween Event :ghost:\nUnscarmble the word to gain candies!\n\nWord: \`${toGuess}\`\nTime: 20 seconds`)
          const collector = message.channel.createMessageCollector(m => m.content.toLowerCase() === randomWord, { time: 20000, max: 1 })
          collector.on('collect', async msg => {
            message.channel.send(`:tada: **${msg.author.username}** guessed the correct word and got **${randomAmount.toLocaleString()}** candies!\nThe word was **${randomWord}**`)
            
            let user = await candeez.findOne({ userId: msg.author.id })
                if(!user){
                   user = new candeez({
                        userId: msg.author.id,
                        candies: 0
                    })
                }
                user.candies += randomAmount
                user.save()
            setTimeout(() => {
              cooldown = cooldown.filter(e => e !== message.channel.id)
            }, 300 * 1000)
          })
        }
       }
    }
}

const getRandom = (w) => {
  let help = `${w}`;
  let results = '';
  let randomLetter = ''
  for(i = 0; i < w.length; i++){
    randomLetter = help.charAt(Math.floor(Math.random() * help.length))
    help = help.replace(randomLetter, '')
    results += randomLetter
  }
  return results
}