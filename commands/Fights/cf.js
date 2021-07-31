const {Command} = require('discord.js-commando');
const {MessageButton, MessageActionRow} = require('discord-buttons');
module.exports = class FightCommand extends Command {
  constructor(client){
    super(client, {
      name: 'coinflip',
      aliases: ['cf'],
      group: "fights",
      memberName: 'f5',
      description: 'Coinflip someone!',
    });
  }
    async run(message) {
      const opponent = message.mentions.users.first();
      if(!opponent) return message.reply('Mention someone who you want to fight with!')
      const thisMessage = await message.channel.send(`${opponent} react to fight with ${message.author}`)
      await thisMessage.react('✅')
      await thisMessage.react('❌')
      const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === opponent.id
      const getRandomString = (length) => {
        let chars = 'ABCDEFGHIJLMNOPQRSTUVWXYZ0123456789'
        let results = ''
        for(var i = 0; i < length; i++){
          results += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return results
      }
      thisMessage.awaitReactions(filter, {max: 1, time: 30000})
        .then(async collected => {
          if(collected.first().emoji.name === '❌') {
            return thisMessage.edit('This fight has been cancelled.')
          }
          let headID = getRandomString(5);
          let tailID = getRandomString(5)
          let headButton = new MessageButton()
            .setStyle('blurple')
            .setLabel('Heads')
            .setID(headID)
          let tailButton = new MessageButton()
            .setStyle('blurple')
            .setLabel('Tails')
            .setID(tailID)
          let thisRow = new MessageActionRow()
            .addComponent(headButton)
            .addComponent(tailButton)

          const mainMessage = await message.channel.send(`${opponent} choose one of the following or die.`, {component: thisRow})
          const filter2 = (button) => button.clicker.user.id === opponent.id
          mainMessage.awaitButtons(filter2, { max: 1, time: 15*1000})
            .then(async col => {
              let chosen;
              if(col.first().id === tailID){
                chosen = 'tail'
              } else if(col.first().id === headID){
                chosen = 'head'
              } else {
                // if this piece of code gets executed imma kms
                console.log('How did we get here?')
              }
              let a;
              let randomChosen;
              let headortail = ['heads', 'tails']
              if(chosen === 'tail'){
                a = await message.channel.send(`<:tails:859055489195573280>${opponent} chose tails`)
                await sleep(750)
                a.edit('<a:animated:859057239604461568>')
                await sleep(1000)
                randomChosen = headortail[Math.floor(Math.random() * headortail.length)]
                if(chosen === 'tail'){
                  a.edit(`${opponent} won!\nYou chose: **${chosen}**\nBot chose: ${randomChosen}`)
                } else {
                  a.edit(`${message.author} won!\nYou chose: **${chosen}**\nBot chose: **${randomChosen}**`)
                }
              } else {
                a = await message.channel.send(`<:heads:859055458584363040>${opponent} chose tails`)
                await sleep(750)
                a.edit('<a:animated:859057239604461568>')
                await sleep(1000)
                randomChosen = headortail[Math.floor(Math.random() * headortail.length)]
                if(chosen === 'head'){
                  a.edit(`${opponent} won!\nYou chose: **${chosen}**\nBot chose: ${randomChosen}`)
                } else {
                  a.edit(`${message.author} won!\nYou chose: **${chosen}**\nBot chose: **${randomChosen}**`)
                }
              }
            })
        })
    }
}
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}